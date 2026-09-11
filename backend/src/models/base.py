"""Shared declarative base for every model module (Task 2 — Database Foundation)."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
