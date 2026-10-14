"""Create the MealBridge SQLite demo database.

Run from the backend directory with ``python seed.py``. The seed is
deterministic and repeatable: running it again refreshes the demo records
without duplicating them. The database path can be overridden with
``DATABASE_URL`` (SQLite URLs only).
"""

from __future__ import annotations

import json
import os
import sqlite3
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse


def database_path() -> Path:
    url = os.getenv("DATABASE_URL", "sqlite:///./mealbridge.db")
    if not url.startswith("sqlite:///"):
        raise ValueError("seed.py supports SQLite DATABASE_URL values only")
    raw_path = unquote(url.removeprefix("sqlite:///"))
    path = Path(raw_path)
    return path if path.is_absolute() else (Path(__file__).parent / path).resolve()


def iso(value: datetime | date) -> str:
    return value.isoformat()


def build_seed(now: datetime) -> dict[str, list[dict]]:
    users = [
        {"id": "U-D01", "name": "Harshal Patil", "email": "harshal@sunrise.in", "role": "donor", "organization": "Sunrise Hostel", "organization_type": "Hostel", "location": "Kothrud, Pune", "latitude": 18.5074, "longitude": 73.8077, "capacity": None, "password_hash": "demo-not-for-production"},
        {"id": "U-D02", "name": "Meera Shah", "email": "meera@greenleaf.in", "role": "donor", "organization": "Greenleaf Café", "organization_type": "Restaurant", "location": "Koregaon Park, Pune", "latitude": 18.5362, "longitude": 73.8943, "capacity": None, "password_hash": "demo-not-for-production"},
        {"id": "U-D03", "name": "Rajesh Kumar", "email": "rajesh@metrokitchen.in", "role": "donor", "organization": "Metro Canteen", "organization_type": "College canteen", "location": "Shivajinagar, Pune", "latitude": 18.5308, "longitude": 73.8474, "capacity": None, "password_hash": "demo-not-for-production"},
        {"id": "U-R01", "name": "Anita Desai", "email": "anita@ashatrust.org", "role": "recipient", "organization": "Asha Trust", "organization_type": "NGO", "location": "Karve Nagar, Pune", "latitude": 18.4912, "longitude": 73.8245, "capacity": 100, "password_hash": "demo-not-for-production"},
        {"id": "U-R02", "name": "Priya Nair", "email": "priya@hopekitchen.org", "role": "recipient", "organization": "Hope Kitchen", "organization_type": "Community Kitchen", "location": "Shivajinagar, Pune", "latitude": 18.5308, "longitude": 73.8474, "capacity": 80, "password_hash": "demo-not-for-production"},
        {"id": "U-R03", "name": "Suresh More", "email": "suresh@greenhope.org", "role": "recipient", "organization": "Green Hope NGO", "organization_type": "NGO", "location": "Bavdhan, Pune", "latitude": 18.5121, "longitude": 73.7857, "capacity": 60, "password_hash": "demo-not-for-production"},
        {"id": "U-R04", "name": "Fatima Sheikh", "email": "fatima@cityshelter.org", "role": "recipient", "organization": "City Shelter NGO", "organization_type": "Shelter", "location": "Hadapsar, Pune", "latitude": 18.5018, "longitude": 73.9260, "capacity": 120, "password_hash": "demo-not-for-production"},
        {"id": "U-R05", "name": "Vikram Joshi", "email": "vikram@sunrisehome.org", "role": "recipient", "organization": "Sunrise Home", "organization_type": "Orphanage", "location": "Baner, Pune", "latitude": 18.5590, "longitude": 73.7868, "capacity": 50, "password_hash": "demo-not-for-production"},
        {"id": "U-C01", "name": "Coordinator Admin", "email": "admin@mealbridge.in", "role": "coordinator", "organization": "MealBridge Platform", "organization_type": "Platform", "location": "Pune", "latitude": 18.5204, "longitude": 73.8567, "capacity": None, "password_hash": "demo-not-for-production"},
    ]
        
    today = now.date()
    deadline_7pm = datetime.combine(today, time(19, 0), tzinfo=timezone.utc)
    created1 = now - timedelta(minutes=12)
    created2 = now - timedelta(minutes=25)
    created3 = now - timedelta(minutes=5)
    completed_at = now - timedelta(days=1, hours=2)
    donations = [
        {"id": "D-001", "donor_id": "U-D01", "food_name": "Cooked Meals", "quantity": 80, "unit": "meals", "status": "RESCUE_TRIGGERED", "created_at": iso(created1), "pickup_deadline": iso(now + timedelta(minutes=47)), "latitude": 18.5074, "longitude": 73.8077, "matched_recipient_id": "U-R04", "confidence": "High", "notes": "Recipient vehicle unavailable; split rescue accepted."},
        {"id": "D-002", "donor_id": "U-D03", "food_name": "Baked Goods", "quantity": 40, "unit": "portions", "status": "MATCHED", "created_at": iso(created2), "pickup_deadline": iso(now + timedelta(minutes=110)), "latitude": 18.5308, "longitude": 73.8474, "matched_recipient_id": "U-R03", "confidence": "Medium", "notes": "Awaiting recipient acceptance."},
        {"id": "D-003", "donor_id": "U-D02", "food_name": "Rice & Dal", "quantity": 55, "unit": "portions", "status": "PENDING", "created_at": iso(created3), "pickup_deadline": iso(deadline_7pm), "latitude": 18.5362, "longitude": 73.8943, "matched_recipient_id": None, "confidence": "High", "notes": "Ready for automatic matching."},
        {"id": "D-098", "donor_id": "U-D01", "food_name": "Rice & Dal", "quantity": 60, "unit": "meals", "status": "RESCUED", "created_at": iso(completed_at - timedelta(minutes=42)), "pickup_deadline": iso(completed_at + timedelta(minutes=45)), "latitude": 18.5074, "longitude": 73.8077, "matched_recipient_id": "U-R01", "confidence": "High", "notes": "Completed rescue with confirmed physical handover."},
    ]
    timeline = [
        {"id": "T-098-1", "donation_id": "D-098", "event_type": "CREATED", "description": "Donation logged — 60 meals", "occurred_at": iso(completed_at - timedelta(minutes=42)), "actor_id": "U-D01", "metadata": {}},
        {"id": "T-098-2", "donation_id": "D-098", "event_type": "MATCHED", "description": "Matched with Asha Trust", "occurred_at": iso(completed_at - timedelta(minutes=38)), "actor_id": "U-C01", "metadata": {"recipient_id": "U-R01", "score": 94}},
        {"id": "T-098-3", "donation_id": "D-098", "event_type": "RESCUE_TRIGGERED", "description": "Original pickup failed; rescue recovery started", "occurred_at": iso(completed_at - timedelta(minutes=24)), "actor_id": "U-C01", "metadata": {"reason": "Vehicle unavailable"}},
        {"id": "T-098-4", "donation_id": "D-098", "event_type": "RESCUE_ASSIGNED", "description": "Asha Trust accepted the replacement pickup", "occurred_at": iso(completed_at - timedelta(minutes=18)), "actor_id": "U-R01", "metadata": {"quantity": 60}},
        {"id": "T-098-5", "donation_id": "D-098", "event_type": "HANDOVER_CONFIRMED", "description": "Recipient confirmed physical handover — 60 meals rescued", "occurred_at": iso(completed_at), "actor_id": "U-R01", "metadata": {"quantity": 60, "unit": "meals"}},
        {"id": "T-001-1", "donation_id": "D-001", "event_type": "CREATED", "description": "Donation logged — 80 meals", "occurred_at": iso(created1), "actor_id": "U-D01", "metadata": {}},
        {"id": "T-001-2", "donation_id": "D-001", "event_type": "MATCHED", "description": "Matched with City Shelter NGO", "occurred_at": iso(created1 + timedelta(minutes=2)), "actor_id": "U-C01", "metadata": {"recipient_id": "U-R04", "score": 91}},
        {"id": "T-001-3", "donation_id": "D-001", "event_type": "RECIPIENT_DECLINED", "description": "City Shelter declined — vehicle unavailable", "occurred_at": iso(created1 + timedelta(minutes=5)), "actor_id": "U-R04", "metadata": {"reason": "Vehicle unavailable"}},
        {"id": "T-001-4", "donation_id": "D-001", "event_type": "RESCUE_TRIGGERED", "description": "Rescue engine triggered; Asha Trust (50) and Hope Kitchen (30) accepted", "occurred_at": iso(created1 + timedelta(minutes=6)), "actor_id": "U-C01", "metadata": {"splits": [{"recipient_id": "U-R01", "quantity": 50}, {"recipient_id": "U-R02", "quantity": 30}]}},
        {"id": "T-002-1", "donation_id": "D-002", "event_type": "CREATED", "description": "Donation logged — 40 portions", "occurred_at": iso(created2), "actor_id": "U-D03", "metadata": {}},
        {"id": "T-002-2", "donation_id": "D-002", "event_type": "MATCHED", "description": "Matched with Green Hope NGO", "occurred_at": iso(created2 + timedelta(minutes=2)), "actor_id": "U-C01", "metadata": {"recipient_id": "U-R03", "score": 81}},
        {"id": "T-003-1", "donation_id": "D-003", "event_type": "CREATED", "description": "Donation logged — 55 portions", "occurred_at": iso(created3), "actor_id": "U-D02", "metadata": {}},
    ]
    rescues = [
        {"id": "R-001", "donation_id": "D-001", "original_recipient_id": "U-R04", "status": "IN_PROGRESS", "triggered_at": iso(created1 + timedelta(minutes=6)), "reason": "Recipient declined: vehicle unavailable"},
        {"id": "R-098", "donation_id": "D-098", "original_recipient_id": "U-R03", "status": "COMPLETED", "triggered_at": iso(completed_at - timedelta(minutes=24)), "reason": "Original recipient could not collect"},
    ]
    rescue_splits = [
        {"id": "RS-001-A", "rescue_id": "R-001", "recipient_id": "U-R01", "quantity": 50, "status": "ACCEPTED", "accepted_at": iso(created1 + timedelta(minutes=8)), "handover_at": None},
        {"id": "RS-001-B", "rescue_id": "R-001", "recipient_id": "U-R02", "quantity": 30, "status": "ACCEPTED", "accepted_at": iso(created1 + timedelta(minutes=8)), "handover_at": None},
        {"id": "RS-098-A", "rescue_id": "R-098", "recipient_id": "U-R01", "quantity": 60, "status": "HANDED_OVER", "accepted_at": iso(completed_at - timedelta(minutes=18)), "handover_at": iso(completed_at)},
    ]
    history = []
    patterns = [("U-D01", "Cooked Meals", 118, 81), ("U-D02", "Rice & Dal", 126, 76), ("U-D03", "Baked Goods", 93, 58)]
    for days_ago in range(1, 61):
        sample_day = today - timedelta(days=days_ago)
        for donor_id, food_name, base, swing in patterns:
            weekday_factor = (1.12 if sample_day.weekday() in (4, 5) else 0.92 if sample_day.weekday() == 0 else 1.0)
            variation = ((days_ago * 17 + int(donor_id[-1]) * 13) % swing) - swing // 2
            meals = max(10, round((base + variation) * weekday_factor))
            history.append({"id": f"H-{days_ago:02d}-{donor_id[-1]}", "donor_id": donor_id, "sample_date": sample_day.isoformat(), "weekday": sample_day.strftime("%A"), "food_name": food_name, "meals_prepared": meals + 35, "meals_served": 35, "surplus_meals": meals, "weather": ("rainy" if days_ago % 11 == 0 else "clear"), "event_tag": ("campus_event" if days_ago % 14 == 0 else None)})
    return {"users": users, "donations": donations, "donation_events": timeline, "rescues": rescues, "rescue_splits": rescue_splits, "surplus_history": history}


SCHEMA = """
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 role TEXT NOT NULL CHECK(role IN ('donor','recipient','coordinator')),
 organization TEXT NOT NULL, organization_type TEXT NOT NULL, location TEXT NOT NULL,
 latitude REAL NOT NULL, longitude REAL NOT NULL, capacity INTEGER,
 password_hash TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS donations (
 id TEXT PRIMARY KEY, donor_id TEXT NOT NULL REFERENCES users(id), food_name TEXT NOT NULL,
 quantity INTEGER NOT NULL CHECK(quantity > 0), unit TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('PENDING','MATCHED','RESCUE_TRIGGERED','RESCUED','FAILED')),
 created_at TEXT NOT NULL, pickup_deadline TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL,
 matched_recipient_id TEXT REFERENCES users(id), confidence TEXT, notes TEXT
);
CREATE TABLE IF NOT EXISTS donation_events (
 id TEXT PRIMARY KEY, donation_id TEXT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
 event_type TEXT NOT NULL, description TEXT NOT NULL, occurred_at TEXT NOT NULL,
 actor_id TEXT REFERENCES users(id), metadata_json TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS rescues (
 id TEXT PRIMARY KEY, donation_id TEXT NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
 original_recipient_id TEXT REFERENCES users(id), status TEXT NOT NULL,
 triggered_at TEXT NOT NULL, reason TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS rescue_splits (
 id TEXT PRIMARY KEY, rescue_id TEXT NOT NULL REFERENCES rescues(id) ON DELETE CASCADE,
 recipient_id TEXT NOT NULL REFERENCES users(id), quantity INTEGER NOT NULL CHECK(quantity > 0),
 status TEXT NOT NULL, accepted_at TEXT, handover_at TEXT
);
CREATE TABLE IF NOT EXISTS surplus_history (
 id TEXT PRIMARY KEY, donor_id TEXT NOT NULL REFERENCES users(id), sample_date TEXT NOT NULL,
 weekday TEXT NOT NULL, food_name TEXT NOT NULL, meals_prepared INTEGER NOT NULL,
 meals_served INTEGER NOT NULL, surplus_meals INTEGER NOT NULL CHECK(surplus_meals >= 0),
 weather TEXT NOT NULL, event_tag TEXT
);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_events_donation ON donation_events(donation_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_history_donor_date ON surplus_history(donor_id, sample_date);
"""


TABLE_COLUMNS = {
    "users": "id,name,email,role,organization,organization_type,location,latitude,longitude,capacity,password_hash,created_at",
    "donations": "id,donor_id,food_name,quantity,unit,status,created_at,pickup_deadline,latitude,longitude,matched_recipient_id,confidence,notes",
    "donation_events": "id,donation_id,event_type,description,occurred_at,actor_id,metadata_json",
    "rescues": "id,donation_id,original_recipient_id,status,triggered_at,reason",
    "rescue_splits": "id,rescue_id,recipient_id,quantity,status,accepted_at,handover_at",
    "surplus_history": "id,donor_id,sample_date,weekday,food_name,meals_prepared,meals_served,surplus_meals,weather,event_tag",
}


def seed(conn: sqlite3.Connection, now: datetime) -> dict[str, int]:
    data = build_seed(now)
    conn.executescript(SCHEMA)
    conn.execute("BEGIN")
    try:
        # Delete in child-to-parent order so SQLite foreign keys remain enabled.
        for table in ("rescue_splits", "rescues", "donation_events", "donations", "surplus_history", "users"):
            conn.execute(f"DELETE FROM {table}")
        for table, rows in data.items():
            columns = TABLE_COLUMNS[table].split(",")
            placeholders = ",".join("?" for _ in columns)
            sql = f"INSERT INTO {table} ({','.join(columns)}) VALUES ({placeholders})"
            values = []
            for row in rows:
                normalized = dict(row)
                if table == "users":
                    normalized["created_at"] = iso(now)
                if table == "donation_events":
                    normalized["metadata_json"] = json.dumps(normalized.pop("metadata"), sort_keys=True)
                values.append(tuple(normalized.get(column) for column in columns))
            conn.executemany(sql, values)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    return {table: len(rows) for table, rows in data.items()}


def main() -> None:
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as conn:
        counts = seed(conn, datetime.now(timezone.utc))
    print(f"Seeded MealBridge demo database: {path}")
    print("  " + " | ".join(f"{table}: {count}" for table, count in counts.items()))
    print("Demo login accounts use the emails in users; password hashes are placeholders, not production credentials.")


if __name__ == "__main__":
    main()
