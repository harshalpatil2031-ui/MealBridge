"""SQLite-backed read and donation workflow API for MealBridge."""

from __future__ import annotations

import json
import math
import secrets
import sqlite3
from datetime import datetime, timezone
from itertools import combinations
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from database import connect
from auth import get_current_user

router = APIRouter()


class DonationCreate(BaseModel):
    food_name: str = Field(min_length=1, max_length=120)
    quantity: int = Field(gt=0, le=100_000)
    unit: str = Field(min_length=1, max_length=24)
    pickup_deadline: str = Field(min_length=1)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    notes: str | None = Field(default=None, max_length=1000)


class MatchRequest(BaseModel):
    actor_id: str | None = None


class CancelRequest(BaseModel):
    recipient_id: str = Field(min_length=1)
    reason: str = Field(min_length=1, max_length=500)
    actor_id: str | None = None


class AcceptRequest(BaseModel):
    recipient_id: str = Field(min_length=1)
    split_id: str | None = None
    actor_id: str | None = None


class HandoverRequest(BaseModel):
    recipient_id: str = Field(min_length=1)
    confirmed_quantity: int = Field(gt=0)
    split_id: str | None = None
    actor_id: str | None = None


def _dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    return dict(row) if row is not None else None


def _new_id(prefix: str) -> str:
    return f"{prefix}-{datetime.now(timezone.utc):%Y%m%d}-{secrets.token_hex(3).upper()}"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _parse_datetime(value: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Pickup deadline must be a valid ISO-8601 datetime.") from exc
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise HTTPException(status_code=400, detail="Pickup deadline must include a timezone.")
    return parsed.astimezone(timezone.utc)


def _parse_future_datetime(value: str) -> datetime:
    parsed = _parse_datetime(value)
    if parsed <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Pickup deadline must be in the future.")
    return parsed


def _recipient(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "name": row["name"],
        "organization": row["organization"],
        "organization_type": row["organization_type"],
        "location": row["location"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "capacity": row["capacity"],
        "available": True,
        "availability_basis": "demo_assumption",
    }


def _donation_row(conn: sqlite3.Connection, donation_id: str) -> sqlite3.Row:
    row = conn.execute(
        """SELECT d.id, d.donor_id, donor.organization AS donor_name,
                  d.food_name, d.quantity, d.unit, d.status, d.created_at,
                  d.pickup_deadline, d.latitude, d.longitude,
                  d.matched_recipient_id,
                  recipient.organization AS matched_recipient_name,
                  d.confidence, d.notes
           FROM donations d
           JOIN users donor ON donor.id = d.donor_id
           LEFT JOIN users recipient ON recipient.id = d.matched_recipient_id
           WHERE d.id = ?""",
        (donation_id,),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Donation not found.")
    return row


def _donation_summary(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "donor_id": row["donor_id"],
        "donor_name": row["donor_name"],
        "food_name": row["food_name"],
        "quantity": row["quantity"],
        "unit": row["unit"],
        "status": row["status"],
        "created_at": row["created_at"],
        "pickup_deadline": row["pickup_deadline"],
        "latitude": row["latitude"],
        "longitude": row["longitude"],
        "matched_recipient_id": row["matched_recipient_id"],
        "matched_recipient_name": row["matched_recipient_name"],
        "confidence": row["confidence"],
        "notes": row["notes"],
    }


def _event(conn: sqlite3.Connection, donation_id: str, event_type: str,
           description: str, actor_id: str | None, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
    event_id = _new_id("T")
    occurred_at = _now()
    conn.execute(
        """INSERT INTO donation_events
           (id, donation_id, event_type, description, occurred_at, actor_id, metadata_json)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (event_id, donation_id, event_type, description, occurred_at, actor_id,
         json.dumps(metadata or {}, sort_keys=True)),
    )
    return {
        "id": event_id,
        "donation_id": donation_id,
        "event_type": event_type,
        "description": description,
        "occurred_at": occurred_at,
        "actor_id": actor_id,
        "metadata": metadata or {},
    }


def _event_from_row(row: sqlite3.Row) -> dict[str, Any]:
    try:
        metadata = json.loads(row["metadata_json"] or "{}")
    except (TypeError, json.JSONDecodeError):
        metadata = {}
    return {
        "id": row["id"], "donation_id": row["donation_id"],
        "event_type": row["event_type"], "description": row["description"],
        "occurred_at": row["occurred_at"], "actor_id": row["actor_id"],
        "metadata": metadata,
    }


def _actor(conn: sqlite3.Connection, actor_id: str | None, default: str) -> str:
    resolved = actor_id or default
    if conn.execute("SELECT 1 FROM users WHERE id = ?", (resolved,)).fetchone() is None:
        raise HTTPException(status_code=404, detail="Actor not found.")
    return resolved


def _user(conn: sqlite3.Connection, user_id: str, role: str | None = None) -> sqlite3.Row:
    query = "SELECT * FROM users WHERE id = ?"
    params: tuple[str, ...] = (user_id,)
    if role:
        query += " AND role = ?"
        params += (role,)
    row = conn.execute(query, params).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"{role.title() if role else 'User'} not found.")
    return row


def _require_role(current_user: dict[str, Any], *roles: str) -> None:
    if current_user.get("role") not in roles:
        raise HTTPException(status_code=403, detail="Your account role is not allowed to perform this action.")


def _can_view_donation(conn: sqlite3.Connection, donation_id: str, current_user: dict[str, Any]) -> bool:
    role = current_user["role"]
    if role == "coordinator":
        return True
    if role == "donor":
        return conn.execute("SELECT 1 FROM donations WHERE id = ? AND donor_id = ?", (donation_id, current_user["id"])).fetchone() is not None
    return conn.execute(
        """SELECT 1 FROM donations d WHERE d.id = ? AND (
             d.matched_recipient_id = ? OR EXISTS (
               SELECT 1 FROM rescues r JOIN rescue_splits s ON s.rescue_id = r.id
               WHERE r.donation_id = d.id AND s.recipient_id = ?
             ) OR (
               d.status = 'MATCHED'
               AND EXISTS (SELECT 1 FROM users u WHERE u.id = ? AND u.role = 'recipient' AND u.capacity >= d.quantity)
               AND NOT EXISTS (SELECT 1 FROM donation_events e WHERE e.donation_id = d.id AND e.event_type = 'RECIPIENT_ACCEPTED')
             ))""",
        (donation_id, current_user["id"], current_user["id"], current_user["id"]),
    ).fetchone() is not None


def _event_exists(conn: sqlite3.Connection, donation_id: str, event_type: str,
                  recipient_id: str, split_id: str | None = None) -> bool:
    rows = conn.execute(
        "SELECT metadata_json FROM donation_events WHERE donation_id = ? AND event_type = ?",
        (donation_id, event_type),
    ).fetchall()
    for row in rows:
        try:
            metadata = json.loads(row["metadata_json"] or "{}")
        except (TypeError, json.JSONDecodeError):
            metadata = {}
        if metadata.get("recipient_id") == recipient_id and metadata.get("split_id") == split_id:
            return True
    return False


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    value = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def _candidate(conn: sqlite3.Connection, donation: sqlite3.Row,
               recipient: sqlite3.Row, rank: int) -> dict[str, Any]:
    distance = _haversine_km(
        donation["latitude"], donation["longitude"], recipient["latitude"], recipient["longitude"]
    )
    capacity_surplus = max(0, recipient["capacity"] - donation["quantity"])
    # This transparent heuristic is a ranking aid, not a probability or ML confidence.
    score = round(max(0, min(100, 100 - min(distance * 5, 50)
                              + min(capacity_surplus / donation["quantity"] * 10, 10))))
    return {
        "recipient": _recipient(recipient),
        "distance_km": round(distance, 2),
        "capacity_fit": "FULL",
        "eligible": True,
        "rank": rank,
        "score": score,
        "reasons": [
            f"Capacity covers {donation['quantity']} {donation['unit']}",
            f"{distance:.1f} km straight-line distance",
            "Deadline is in the future",
            "Availability assumed for demo",
        ],
    }


def _recipient_rows(conn: sqlite3.Connection, exclude_ids: set[str] | None = None) -> list[sqlite3.Row]:
    rows = conn.execute(
        """SELECT id, name, organization, organization_type, location,
                  latitude, longitude, capacity
           FROM users WHERE role = 'recipient' ORDER BY organization COLLATE NOCASE, id"""
    ).fetchall()
    excluded = exclude_ids or set()
    return [row for row in rows if row["id"] not in excluded]


def _split_plan(candidates: list[sqlite3.Row], donation: sqlite3.Row) -> tuple[str | None, list[tuple[sqlite3.Row, int]]]:
    """Prefer one recipient; otherwise choose fewest recipients then shortest distance.

    For a split, allocate nearer recipients first, capped at each stored capacity,
    until the donation quantity is covered exactly.
    """
    quantity = donation["quantity"]
    ranked = sorted(
        candidates,
        key=lambda row: (
            _haversine_km(donation["latitude"], donation["longitude"], row["latitude"], row["longitude"]),
            row["id"],
        ),
    )
    full = [row for row in ranked if row["capacity"] is not None and row["capacity"] >= quantity]
    if full:
        chosen = full[0]
        return "ALTERNATIVE", [(chosen, quantity)]

    partial = [row for row in ranked if row["capacity"] is not None and row["capacity"] > 0]
    for count in range(2, len(partial) + 1):
        feasible: list[tuple[float, tuple[str, ...], tuple[sqlite3.Row, ...]]] = []
        for group in combinations(partial, count):
            if sum(row["capacity"] for row in group) >= quantity:
                total_distance = sum(
                    _haversine_km(donation["latitude"], donation["longitude"], row["latitude"], row["longitude"])
                    for row in group
                )
                feasible.append((total_distance, tuple(row["id"] for row in group), group))
        if feasible:
            _, _, group = min(feasible, key=lambda item: (item[0], item[1]))
            remaining = quantity
            allocations: list[tuple[sqlite3.Row, int]] = []
            for row in sorted(group, key=lambda item: (
                _haversine_km(donation["latitude"], donation["longitude"], item["latitude"], item["longitude"]),
                item["id"],
            )):
                amount = min(row["capacity"], remaining)
                if amount:
                    allocations.append((row, amount))
                    remaining -= amount
                if remaining == 0:
                    break
            if remaining == 0:
                return "SPLIT", allocations
    return None, []


def _split(conn: sqlite3.Connection, split_id: str) -> sqlite3.Row:
    row = conn.execute(
        """SELECT s.*, r.donation_id, recipient.role AS recipient_role
           FROM rescue_splits s JOIN rescues r ON r.id = s.rescue_id
           JOIN users recipient ON recipient.id = s.recipient_id WHERE s.id = ?""",
        (split_id,),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Recovery split not found.")
    return row


def _split_summary(conn: sqlite3.Connection, row: sqlite3.Row) -> dict[str, Any]:
    recipient = conn.execute(
        "SELECT organization FROM users WHERE id = ?", (row["recipient_id"],)
    ).fetchone()
    return {
        "id": row["id"],
        "rescue_id": row["rescue_id"],
        "recipient_id": row["recipient_id"],
        "recipient_name": recipient["organization"] if recipient else None,
        "quantity": row["quantity"],
        "status": row["status"],
        "accepted_at": row["accepted_at"],
        "handover_at": row["handover_at"],
    }


@router.get("/recipients")
def list_recipients(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, list[dict[str, Any]]]:
    """List recipient organizations without exposing credentials or email."""
    _require_role(current_user, "donor", "coordinator")
    with connect() as conn:
        rows = _recipient_rows(conn)
    return {"items": [_recipient(row) for row in rows]}


@router.get("/donations")
def list_donations(
    donor_id: str | None = Query(default=None, min_length=1),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, list[dict[str, Any]]]:
    """List only records visible to the authenticated user's role."""
    role = current_user["role"]
    if role == "donor" and donor_id not in (None, current_user["id"]):
        raise HTTPException(status_code=403, detail="Donors can only view their own donations.")
    if role == "recipient" and donor_id is not None:
        raise HTTPException(status_code=403, detail="Recipients cannot filter donations by donor.")
    with connect() as conn:
        sql = """SELECT d.id, d.donor_id, donor.organization AS donor_name,
                        d.food_name, d.quantity, d.unit, d.status, d.created_at,
                        d.pickup_deadline, d.latitude, d.longitude,
                        d.matched_recipient_id,
                        recipient.organization AS matched_recipient_name,
                        d.confidence, d.notes
                 FROM donations d JOIN users donor ON donor.id = d.donor_id
                 LEFT JOIN users recipient ON recipient.id = d.matched_recipient_id"""
        params: tuple[str, ...] = ()
        if role == "donor":
            sql += " WHERE d.donor_id = ?"
            params = (current_user["id"],)
        elif role == "recipient":
            sql += """ WHERE d.matched_recipient_id = ? OR EXISTS (
                SELECT 1 FROM rescues r JOIN rescue_splits s ON s.rescue_id = r.id
                WHERE r.donation_id = d.id AND s.recipient_id = ?
            ) OR (
                d.status = 'MATCHED'
                AND EXISTS (SELECT 1 FROM users u WHERE u.id = ? AND u.role = 'recipient' AND u.capacity >= d.quantity)
                AND NOT EXISTS (SELECT 1 FROM donation_events e WHERE e.donation_id = d.id AND e.event_type = 'RECIPIENT_ACCEPTED')
            )"""
            params = (current_user["id"], current_user["id"], current_user["id"])
        elif donor_id is not None:
            _user(conn, donor_id, "donor")
            sql += " WHERE d.donor_id = ?"
            params = (donor_id,)
        sql += " ORDER BY d.created_at DESC, d.id DESC"
        rows = conn.execute(sql, params).fetchall()
    return {"items": [_donation_summary(row) for row in rows]}


@router.get("/donations/{donation_id}")
def get_donation(donation_id: str, current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Read a donation with its ordered event history and latest rescue."""
    with connect() as conn:
        if not _can_view_donation(conn, donation_id, current_user):
            raise HTTPException(status_code=404, detail="Donation not found.")
        donation = _donation_row(conn, donation_id)
        event_rows = conn.execute(
            """SELECT id, donation_id, event_type, description, occurred_at,
                      actor_id, metadata_json FROM donation_events
               WHERE donation_id = ? ORDER BY occurred_at ASC, id ASC""",
            (donation_id,),
        ).fetchall()
        rescue_row = conn.execute(
            """SELECT r.id, r.original_recipient_id,
                      original.organization AS original_recipient_name,
                      r.status, r.triggered_at, r.reason
               FROM rescues r LEFT JOIN users original ON original.id = r.original_recipient_id
               WHERE r.donation_id = ? ORDER BY r.triggered_at DESC, r.id DESC LIMIT 1""",
            (donation_id,),
        ).fetchone()
        split_rows = []
        if rescue_row is not None:
            split_rows = conn.execute(
                """SELECT s.id, s.rescue_id, s.recipient_id,
                          recipient.organization AS recipient_name,
                          s.quantity, s.status, s.accepted_at, s.handover_at
                   FROM rescue_splits s JOIN users recipient ON recipient.id = s.recipient_id
                   WHERE s.rescue_id = ? ORDER BY s.id ASC""",
                (rescue_row["id"],),
            ).fetchall()
    return {
        "donation": _donation_summary(donation),
        "events": [_event_from_row(row) for row in event_rows],
        "rescue": _dict(rescue_row),
        "splits": [_dict(row) for row in split_rows],
    }


@router.post("/donations", status_code=status.HTTP_201_CREATED)
def create_donation(payload: DonationCreate, current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    _require_role(current_user, "donor")
    deadline = _parse_future_datetime(payload.pickup_deadline)
    food_name = payload.food_name.strip()
    unit = payload.unit.strip()
    if not food_name or not unit:
        raise HTTPException(status_code=400, detail="Food name and unit are required.")

    donation_id = _new_id("D")
    created_at = _now()
    with connect() as conn:
        with conn:
            donor = _user(conn, current_user["id"], "donor")
            conn.execute(
                """INSERT INTO donations
                   (id, donor_id, food_name, quantity, unit, status, created_at,
                    pickup_deadline, latitude, longitude, matched_recipient_id, confidence, notes)
                   VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, NULL, NULL, ?)""",
                (donation_id, donor["id"], food_name, payload.quantity, unit, created_at,
                 deadline.isoformat().replace("+00:00", "Z"), payload.latitude,
                 payload.longitude, payload.notes.strip() if payload.notes else None),
            )
            event = _event(
                conn, donation_id, "CREATED",
                f"Donation logged — {payload.quantity} {unit}", donor["id"],
                {"food_name": food_name, "quantity": payload.quantity, "unit": unit},
            )
            donation = _donation_summary(_donation_row(conn, donation_id))
    return {"donation": donation, "event": event}


@router.post("/donations/{donation_id}/match")
def match_donation(donation_id: str, payload: MatchRequest, current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    _require_role(current_user, "donor", "coordinator")
    with connect() as conn:
        with conn:
            donation = _donation_row(conn, donation_id)
            if current_user["role"] == "donor" and donation["donor_id"] != current_user["id"]:
                raise HTTPException(status_code=404, detail="Donation not found.")
            if donation["status"] != "PENDING":
                raise HTTPException(status_code=409, detail="Only pending donations can be matched.")
            actor_id = current_user["id"]
            deadline = _parse_datetime(donation["pickup_deadline"])
            candidates = [
                row for row in _recipient_rows(conn)
                if row["capacity"] is not None and row["capacity"] >= donation["quantity"]
            ] if deadline > datetime.now(timezone.utc) else []
            candidates.sort(key=lambda row: (
                -_candidate(conn, donation, row, 0)["score"], row["id"]
            ))
            candidate_data = [_candidate(conn, donation, row, rank)
                              for rank, row in enumerate(candidates, start=1)]
            selected = candidates[0] if candidates else None
            if selected is not None:
                conn.execute(
                    "UPDATE donations SET status = 'MATCHED', matched_recipient_id = ? WHERE id = ?",
                    (selected["id"], donation_id),
                )
                event = _event(
                    conn, donation_id, "MATCHED",
                    f"Matched with {selected['organization']}", actor_id,
                    {"recipient_id": selected["id"],
                     "distance_km": candidate_data[0]["distance_km"],
                     "score": candidate_data[0]["score"],
                     "rule": "capacity eligible; rank by transparent distance/capacity heuristic"},
                )
                no_match_reason = None
            else:
                event = None
                no_match_reason = (
                    "Pickup deadline has passed."
                    if deadline <= datetime.now(timezone.utc)
                    else "No recipient has enough stated capacity for this donation."
                )
            updated = _donation_summary(_donation_row(conn, donation_id))
    return {
        "donation": updated,
        "selected_recipient": _recipient(selected) if selected else None,
        "candidates": candidate_data,
        "matching_method": "rule_based",
        "no_match_reason": no_match_reason,
        "event": event,
    }


@router.post("/donations/{donation_id}/cancel")
def cancel_donation(donation_id: str, payload: CancelRequest, current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    _require_role(current_user, "recipient", "coordinator")
    reason = payload.reason.strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Cancellation reason is required.")

    with connect() as conn:
        with conn:
            donation = _donation_row(conn, donation_id)
            if donation["status"] != "MATCHED":
                raise HTTPException(status_code=409, detail="Only a matched donation can be cancelled.")
            recipient_id = current_user["id"] if current_user["role"] == "recipient" else payload.recipient_id
            if current_user["role"] == "recipient" and payload.recipient_id not in (None, recipient_id):
                raise HTTPException(status_code=403, detail="You can only cancel your own assigned pickup.")
            if donation["matched_recipient_id"] != recipient_id:
                raise HTTPException(status_code=409, detail="Recipient is not the current matched recipient.")
            actor_id = current_user["id"]
            failed_recipient = _user(conn, recipient_id, "recipient")
            now = _now()
            deadline = _parse_datetime(donation["pickup_deadline"])
            candidates = _recipient_rows(conn, {recipient_id}) if deadline > datetime.now(timezone.utc) else []
            strategy, allocations = _split_plan(candidates, donation)
            rescue_id = _new_id("R")
            recovery_ok = strategy is not None
            rescue_status = "IN_PROGRESS" if recovery_ok else "FAILED"
            donation_status = "RESCUE_TRIGGERED" if recovery_ok else "FAILED"
            conn.execute(
                """INSERT INTO rescues (id, donation_id, original_recipient_id, status, triggered_at, reason)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (rescue_id, donation_id, failed_recipient["id"], rescue_status, now, reason),
            )
            conn.execute("UPDATE donations SET status = ? WHERE id = ?", (donation_status, donation_id))
            failed_event = _event(
                conn, donation_id, "RECIPIENT_DECLINED",
                f"{failed_recipient['organization']} cancelled — {reason}", actor_id,
                {"recipient_id": failed_recipient["id"], "reason": reason},
            )
            splits: list[dict[str, Any]] = []
            plan_event: dict[str, Any]
            if recovery_ok:
                for index, (recipient, quantity) in enumerate(allocations, start=1):
                    split_id = f"RS-{rescue_id}-{index:02d}"
                    conn.execute(
                        """INSERT INTO rescue_splits
                           (id, rescue_id, recipient_id, quantity, status, accepted_at, handover_at)
                           VALUES (?, ?, ?, ?, 'PROPOSED', NULL, NULL)""",
                        (split_id, rescue_id, recipient["id"], quantity),
                    )
                    splits.append({
                        "id": split_id,
                        "recipient_id": recipient["id"],
                        "recipient_name": recipient["organization"],
                        "quantity": quantity,
                        "status": "PROPOSED",
                    })
                explanation = (
                    f"One recipient can take all {donation['quantity']} {donation['unit']}."
                    if strategy == "ALTERNATIVE" else
                    f"No single eligible recipient has capacity for {donation['quantity']} {donation['unit']}; "
                    "these capacities cover the full quantity."
                )
                plan_event = _event(
                    conn, donation_id, "RESCUE_TRIGGERED", "Rescue recovery plan proposed.", actor_id,
                    {"rescue_id": rescue_id, "strategy": strategy, "splits": splits,
                     "quantity": donation["quantity"], "unit": donation["unit"]},
                )
            else:
                explanation = "Available recipient capacities cannot cover the full donation before the deadline."
                plan_event = _event(
                    conn, donation_id, "RECOVERY_FAILED", explanation, actor_id,
                    {"rescue_id": rescue_id, "quantity": donation["quantity"], "unit": donation["unit"]},
                )
            updated = _donation_summary(_donation_row(conn, donation_id))

    return {
        "donation": updated,
        "rescue": {"id": rescue_id, "status": rescue_status, "reason": reason},
        "recovery_plan": {
            "feasible": recovery_ok,
            "strategy": strategy,
            "total_quantity": donation["quantity"],
            "splits": splits,
            "explanation": explanation,
        },
        "events": [failed_event, plan_event],
    }


@router.post("/donations/{donation_id}/accept")
def accept_donation(donation_id: str, payload: AcceptRequest, current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    _require_role(current_user, "recipient")
    if payload.recipient_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only accept pickups assigned to your account.")
    with connect() as conn:
        with conn:
            donation = _donation_row(conn, donation_id)
            recipient = _user(conn, current_user["id"], "recipient")
            actor_id = current_user["id"]

            split_data = None
            metadata: dict[str, Any] = {"recipient_id": recipient["id"]}
            if payload.split_id:
                split = _split(conn, payload.split_id)
                if split["donation_id"] != donation_id or split["recipient_id"] != recipient["id"]:
                    raise HTTPException(status_code=409, detail="Split does not belong to this recipient and donation.")
                if donation["status"] != "RESCUE_TRIGGERED":
                    raise HTTPException(status_code=409, detail="Donation is not awaiting recovery acceptance.")
                if split["status"] != "PROPOSED":
                    raise HTTPException(status_code=409, detail="Only proposed splits can be accepted.")
                conn.execute(
                    "UPDATE rescue_splits SET status = 'ACCEPTED', accepted_at = ? WHERE id = ?",
                    (_now(), split["id"]),
                )
                metadata["split_id"] = split["id"]
                split_data = _split_summary(conn, conn.execute(
                    "SELECT * FROM rescue_splits WHERE id = ?", (split["id"],)
                ).fetchone())
            else:
                if donation["status"] != "MATCHED":
                    raise HTTPException(status_code=409, detail="This donation is no longer open for acceptance.")
                if _event_exists(conn, donation_id, "RECIPIENT_ACCEPTED", recipient["id"]):
                    raise HTTPException(status_code=409, detail="Recipient has already accepted this donation.")
                if conn.execute(
                    "SELECT 1 FROM donation_events WHERE donation_id = ? AND event_type = 'RECIPIENT_ACCEPTED'",
                    (donation_id,),
                ).fetchone():
                    raise HTTPException(status_code=409, detail="Another recipient has already accepted this donation.")
                if recipient["capacity"] is None or recipient["capacity"] < donation["quantity"]:
                    raise HTTPException(status_code=409, detail="Your stated capacity is below this donation's quantity.")
                if _parse_datetime(donation["pickup_deadline"]) <= datetime.now(timezone.utc):
                    raise HTTPException(status_code=409, detail="The pickup deadline has passed.")

                # The top-ranked recipient is a recommendation. Any eligible NGO
                # may claim the offer; this conditional update makes the first
                # recorded acceptance win when multiple NGOs accept concurrently.
                if donation["matched_recipient_id"] != recipient["id"]:
                    metadata["recommended_recipient_id"] = donation["matched_recipient_id"]
                claimed = conn.execute(
                    """UPDATE donations SET matched_recipient_id = ?
                       WHERE id = ? AND status = 'MATCHED'
                         AND NOT EXISTS (
                           SELECT 1 FROM donation_events
                           WHERE donation_id = ? AND event_type = 'RECIPIENT_ACCEPTED'
                         )""",
                    (recipient["id"], donation_id, donation_id),
                )
                if claimed.rowcount != 1:
                    raise HTTPException(status_code=409, detail="Another recipient has already accepted this donation.")
                donation = _donation_row(conn, donation_id)

            event = _event(
                conn, donation_id, "RECIPIENT_ACCEPTED",
                f"{recipient['organization']} accepted the pickup", actor_id, metadata,
            )
            updated = _donation_summary(_donation_row(conn, donation_id))
    return {"donation": updated, "split": split_data, "event": event}


@router.post("/donations/{donation_id}/handover")
def confirm_handover(donation_id: str, payload: HandoverRequest, current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    _require_role(current_user, "recipient")
    if payload.recipient_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only confirm handovers assigned to your account.")
    with connect() as conn:
        with conn:
            donation = _donation_row(conn, donation_id)
            recipient = _user(conn, current_user["id"], "recipient")
            actor_id = current_user["id"]

            split_data = None
            if payload.split_id:
                split = _split(conn, payload.split_id)
                if split["donation_id"] != donation_id or split["recipient_id"] != recipient["id"]:
                    raise HTTPException(status_code=409, detail="Split does not belong to this recipient and donation.")
                if donation["status"] != "RESCUE_TRIGGERED":
                    raise HTTPException(status_code=409, detail="Donation is not awaiting rescue handovers.")
                if split["status"] != "ACCEPTED":
                    raise HTTPException(status_code=409, detail="Split must be accepted before handover.")
                if payload.confirmed_quantity != split["quantity"]:
                    raise HTTPException(status_code=400, detail="This prototype requires handover of the full assigned split.")
                handover_at = _now()
                conn.execute(
                    "UPDATE rescue_splits SET status = 'HANDED_OVER', handover_at = ? WHERE id = ?",
                    (handover_at, split["id"]),
                )
                updated_split = conn.execute(
                    "SELECT * FROM rescue_splits WHERE id = ?", (split["id"],)
                ).fetchone()
                split_data = _split_summary(conn, updated_split)
                total = conn.execute(
                    """SELECT COALESCE(SUM(quantity), 0) AS quantity
                       FROM rescue_splits WHERE rescue_id = ? AND status = 'HANDED_OVER'""",
                    (split["rescue_id"],),
                ).fetchone()["quantity"]
                if total > donation["quantity"]:
                    raise HTTPException(status_code=409, detail="Confirmed portions exceed donation quantity.")
                all_handed = conn.execute(
                    "SELECT COUNT(*) FROM rescue_splits WHERE rescue_id = ? AND status != 'HANDED_OVER'",
                    (split["rescue_id"],),
                ).fetchone()[0] == 0
                rescued = all_handed and total == donation["quantity"]
                if rescued:
                    conn.execute("UPDATE donations SET status = 'RESCUED' WHERE id = ?", (donation_id,))
                    conn.execute("UPDATE rescues SET status = 'COMPLETED' WHERE id = ?", (split["rescue_id"],))
            else:
                if donation["status"] != "MATCHED" or donation["matched_recipient_id"] != recipient["id"]:
                    raise HTTPException(status_code=409, detail="Recipient is not assigned to this matched donation.")
                if payload.confirmed_quantity != donation["quantity"]:
                    raise HTTPException(status_code=400, detail="Confirm the full donation quantity in this prototype.")
                if not _event_exists(conn, donation_id, "RECIPIENT_ACCEPTED", recipient["id"]):
                    raise HTTPException(status_code=409, detail="Recipient must accept before confirming handover.")
                if _event_exists(conn, donation_id, "HANDOVER_CONFIRMED", recipient["id"]):
                    raise HTTPException(status_code=409, detail="Handover has already been confirmed.")
                total = donation["quantity"]
                rescued = True
                conn.execute("UPDATE donations SET status = 'RESCUED' WHERE id = ?", (donation_id,))

            event = _event(
                conn, donation_id, "HANDOVER_CONFIRMED",
                f"{recipient['organization']} confirmed handover — {payload.confirmed_quantity} {donation['unit']}",
                actor_id,
                {"recipient_id": recipient["id"], "split_id": payload.split_id,
                 "quantity": payload.confirmed_quantity, "unit": donation["unit"]},
            )
            updated = _donation_summary(_donation_row(conn, donation_id))
            required_total = donation["quantity"]
    return {
        "donation": updated,
        "split": split_data,
        "confirmed_total": total,
        "required_total": required_total,
        "rescued": rescued,
        "event": event,
    }
