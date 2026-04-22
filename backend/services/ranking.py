"""Ranking and leaderboard utilities."""

from .storage import get_leaderboard


def compute_leaderboard() -> dict:
    return get_leaderboard()
