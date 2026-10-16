"""Small SQLite connection helpers for the MealBridge API."""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator
from urllib.parse import unquote


def database_path() -> Path:
    """Resolve the same SQLite URL format accepted by seed.py."""
    url = os.getenv("DATABASE_URL", "sqlite:///./mealbridge.db")
    if not url.startswith("sqlite:///"):
        raise ValueError("MealBridge API currently supports SQLite DATABASE_URL values only")
    raw_path = unquote(url.removeprefix("sqlite:///"))
    path = Path(raw_path)
    return path if path.is_absolute() else (Path(__file__).parent / path).resolve()


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    """Yield a row-oriented connection and always close it after the request."""
    path = database_path()
    if not path.exists():
        raise FileNotFoundError(
            f"MealBridge database not found at {path}. Run `python seed.py` from backend first."
        )
    conn = sqlite3.connect(path, timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
    finally:
        conn.close()

