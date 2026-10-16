"""Read-only API routes for recipients and donations (A-02)."""

from __future__ import annotations

import json
import sqlite3
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from database import connect

router = APIRouter()


def _dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    return dict(row) if row is not None else None


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


def _event(row: sqlite3.Row) -> dict[str, Any]:
    try:
        metadata = json.loads(row["metadata_json"] or "{}")
    except (TypeError, json.JSONDecodeError):
        metadata = {}
    return {
        "id": row["id"],
        "donation_id": row["donation_id"],
        "event_type": row["event_type"],
        "description": row["description"],
        "occurred_at": row["occurred_at"],
        "actor_id": row["actor_id"],
        "metadata": metadata,
    }


@router.get("/recipients")
def list_recipients() -> dict[str, list[dict[str, Any]]]:
    """List recipient organizations without exposing credentials or email."""
    with connect() as conn:
        rows = conn.execute(
            """SELECT id, name, organization, organization_type, location,
                      latitude, longitude, capacity
               FROM users WHERE role = 'recipient' ORDER BY organization COLLATE NOCASE"""
        ).fetchall()
    return {
        "items": [
            {
                **_dict(row),
                "available": True,
                "availability_basis": "demo_assumption",
            }
            for row in rows
        ]
    }


@router.get("/donations")
def list_donations(
    donor_id: str | None = Query(default=None, min_length=1),
) -> dict[str, list[dict[str, Any]]]:
    """List all donations, or restrict results to one seeded donor."""
    with connect() as conn:
        if donor_id is not None:
            donor = conn.execute(
                "SELECT id FROM users WHERE id = ? AND role = 'donor'", (donor_id,)
            ).fetchone()
            if donor is None:
                raise HTTPException(status_code=404, detail="Donor not found.")

        sql = """SELECT d.id, d.donor_id, donor.organization AS donor_name,
                        d.food_name, d.quantity, d.unit, d.status, d.created_at,
                        d.pickup_deadline, d.latitude, d.longitude,
                        d.matched_recipient_id,
                        recipient.organization AS matched_recipient_name,
                        d.confidence, d.notes
                 FROM donations d
                 JOIN users donor ON donor.id = d.donor_id
                 LEFT JOIN users recipient ON recipient.id = d.matched_recipient_id"""
        params: tuple[str, ...] = ()
        if donor_id is not None:
            sql += " WHERE d.donor_id = ?"
            params = (donor_id,)
        sql += " ORDER BY d.created_at DESC, d.id DESC"
        rows = conn.execute(sql, params).fetchall()
    return {"items": [_donation_summary(row) for row in rows]}


@router.get("/donations/{donation_id}")
def get_donation(donation_id: str) -> dict[str, Any]:
    """Read a donation with its ordered event history and latest rescue."""
    with connect() as conn:
        row = conn.execute(
            """SELECT d.id, d.donor_id, donor.organization AS donor_name,
                      d.food_name, d.quantity, d.unit, d.status, d.created_at,
                      d.pickup_deadline, d.latitude, d.longitude,
                      d.matched_recipient_id,
                      matched.organization AS matched_recipient_name,
                      d.confidence, d.notes
               FROM donations d
               JOIN users donor ON donor.id = d.donor_id
               LEFT JOIN users matched ON matched.id = d.matched_recipient_id
               WHERE d.id = ?""",
            (donation_id,),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Donation not found.")

        event_rows = conn.execute(
            """SELECT id, donation_id, event_type, description, occurred_at,
                      actor_id, metadata_json
               FROM donation_events WHERE donation_id = ?
               ORDER BY occurred_at ASC, id ASC""",
            (donation_id,),
        ).fetchall()
        rescue_row = conn.execute(
            """SELECT r.id, r.original_recipient_id,
                      original.organization AS original_recipient_name,
                      r.status, r.triggered_at, r.reason
               FROM rescues r
               LEFT JOIN users original ON original.id = r.original_recipient_id
               WHERE r.donation_id = ?
               ORDER BY r.triggered_at DESC, r.id DESC LIMIT 1""",
            (donation_id,),
        ).fetchone()
        split_rows = []
        if rescue_row is not None:
            split_rows = conn.execute(
                """SELECT s.id, s.rescue_id, s.recipient_id,
                          recipient.organization AS recipient_name,
                          s.quantity, s.status, s.accepted_at, s.handover_at
                   FROM rescue_splits s
                   JOIN users recipient ON recipient.id = s.recipient_id
                   WHERE s.rescue_id = ?
                   ORDER BY s.id ASC""",
                (rescue_row["id"],),
            ).fetchall()

    return {
        "donation": _donation_summary(row),
        "events": [_event(event_row) for event_row in event_rows],
        "rescue": _dict(rescue_row),
        "splits": [_dict(split_row) for split_row in split_rows],
    }

