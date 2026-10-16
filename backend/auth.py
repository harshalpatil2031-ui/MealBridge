"""Password-based prototype authentication with revocable SQLite sessions."""

from __future__ import annotations

import hashlib
import hmac
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from database import connect

router = APIRouter(prefix="/auth", tags=["authentication"])
bearer = HTTPBearer(auto_error=False)
DEMO_PASSWORDS = {
    "donor": "MealBridgeDonor2026!",
    "recipient": "MealBridgeNGO2026!",
    "coordinator": "MealBridgeCoordinator2026!",
}
PBKDF2_ITERATIONS = 310_000
SESSION_HOURS = 12


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    organization: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    role: Literal["donor", "recipient"]
    location: str = Field(min_length=2, max_length=160)
    capacity: int | None = Field(default=None, ge=1, le=100_000)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=1, max_length=128)


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${derived.hex()}"


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, rounds, salt_hex, expected_hex = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(rounds))
        return hmac.compare_digest(actual.hex(), expected_hex)
    except (ValueError, TypeError):
        return False


def initialize_auth() -> None:
    """Create the session table and migrate the original placeholder demo hashes."""
    with connect() as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS auth_sessions (
            token_hash TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL
        )""")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expires_at)")
        conn.execute("CREATE TABLE IF NOT EXISTS auth_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)")
        migration_name = "role_specific_demo_passwords_v1"
        migration_done = conn.execute("SELECT 1 FROM auth_migrations WHERE name = ?", (migration_name,)).fetchone()
        if not migration_done:
            demo_rows = conn.execute("SELECT id, role, password_hash FROM users").fetchall()
            migrations = []
            for row in demo_rows:
                is_placeholder = row["password_hash"] == "demo-not-for-production"
                is_previous_shared_demo = _verify_password("MealBridgeDemo2026!", row["password_hash"])
                if is_placeholder or is_previous_shared_demo:
                    migrations.append((hash_password(DEMO_PASSWORDS[row["role"]]), row["id"]))
            if migrations:
                conn.executemany("UPDATE users SET password_hash = ? WHERE id = ?", migrations)
            conn.execute("INSERT INTO auth_migrations (name, applied_at) VALUES (?, ?)", (migration_name, datetime.now(timezone.utc).isoformat(timespec="seconds")))
        now = datetime.now(timezone.utc).isoformat(timespec="seconds")
        conn.execute("DELETE FROM auth_sessions WHERE expires_at <= ?", (now,))
        conn.commit()


def _public_user(row) -> dict[str, object]:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
        "organization": row["organization"],
        "organization_type": row["organization_type"],
        "location": row["location"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "capacity": row["capacity"],
    }


def _new_session(conn, user_id: str) -> tuple[str, str]:
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("ascii")).hexdigest()
    now = datetime.now(timezone.utc)
    expires = now + timedelta(hours=SESSION_HOURS)
    conn.execute(
        "INSERT INTO auth_sessions (token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)",
        (token_hash, user_id, expires.isoformat(timespec="seconds"), now.isoformat(timespec="seconds")),
    )
    return token, expires.isoformat(timespec="seconds")


def _session_response(conn, user) -> dict[str, object]:
    token, expires_at = _new_session(conn, user["id"])
    return {"access_token": token, "token_type": "bearer", "expires_at": expires_at, "user": _public_user(user)}


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest) -> dict[str, object]:
    name = payload.name.strip()
    organization = payload.organization.strip()
    location = payload.location.strip()
    email = payload.email.strip().lower()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    if not name or not organization or not location:
        raise HTTPException(status_code=422, detail="Name, organization, and location are required.")
    if payload.role == "recipient" and payload.capacity is None:
        raise HTTPException(status_code=422, detail="Meal capacity is required for recipient accounts.")
    if payload.role == "recipient" and payload.capacity is not None and payload.capacity < 1:
        raise HTTPException(status_code=422, detail="Recipient capacity must be at least 1.")

    user_id = f"U-{ 'D' if payload.role == 'donor' else 'R' }{secrets.token_hex(5).upper()}"
    password_hash = hash_password(payload.password)
    organization_type = "Food donor" if payload.role == "donor" else "NGO / community recipient"
    # Registration currently accepts a human-readable location; coordinates are
    # an explicitly approximate Pune fallback until geocoding is added.
    latitude, longitude = 18.5204, 73.8567
    with connect() as conn:
        try:
            with conn:
                conn.execute(
                    """INSERT INTO users
                    (id,name,email,role,organization,organization_type,location,latitude,longitude,capacity,password_hash,created_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (user_id, name, email, payload.role, organization, organization_type, location,
                     latitude, longitude, payload.capacity if payload.role == "recipient" else None,
                     password_hash, datetime.now(timezone.utc).isoformat(timespec="seconds")),
                )
                user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
                response = _session_response(conn, user)
        except Exception as error:
            if "UNIQUE constraint failed: users.email" in str(error):
                raise HTTPException(status_code=409, detail="An account with this email already exists.") from error
            raise
    return response


@router.post("/login")
def login(payload: LoginRequest) -> dict[str, object]:
    email = payload.email.strip().lower()
    with connect() as conn:
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if user is None or not _verify_password(payload.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Email or password is incorrect.")
        with conn:
            conn.execute("DELETE FROM auth_sessions WHERE user_id = ?", (user["id"],))
            response = _session_response(conn, user)
    return response


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict[str, object]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Sign in to continue.", headers={"WWW-Authenticate": "Bearer"})
    token_hash = hashlib.sha256(credentials.credentials.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with connect() as conn:
        row = conn.execute(
            """SELECT u.* FROM auth_sessions s JOIN users u ON u.id = s.user_id
               WHERE s.token_hash = ? AND s.expires_at > ?""",
            (token_hash, now),
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=401, detail="Your session has expired. Sign in again.", headers={"WWW-Authenticate": "Bearer"})
    return _public_user(row)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> None:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Sign in to continue.")
    token_hash = hashlib.sha256(credentials.credentials.encode("utf-8")).hexdigest()
    with connect() as conn:
        conn.execute("DELETE FROM auth_sessions WHERE token_hash = ?", (token_hash,))
        conn.commit()


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)) -> dict[str, object]:
    return current_user
