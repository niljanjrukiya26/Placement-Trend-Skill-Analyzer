"""Utility functions for Skill Gap analysis.

This module provides helpers used by the skillgap routes.
Currently it implements a simple readiness level classifier and a
placeholder action-plan generator that can be extended later.
"""

from typing import Iterable, Dict, Any, List


def calculate_readiness_level(score: float) -> str:
    """Map a numeric readiness score (0-100) to a label.

    High   : score >= 80
    Medium : 50 <= score < 80
    Low    : score < 50
    """
    try:
        value = float(score)
    except (TypeError, ValueError):
        value = 0.0

    if value >= 80:
        return "High"
    if value >= 50:
        return "Medium"
    return "Low"


def generate_action_plan(target_job_role: str,
                         missing_skills: Iterable[str],
                         branch: str) -> Dict[str, Any]:
    """Return a simple structured 30-day micro action plan.

    This is a lightweight, deterministic implementation that
    does not call any external AI services. It is designed to
    satisfy the current API contract used by the /action-plan
    endpoint without introducing extra dependencies.
    """
    skills_list: List[str] = [s for s in (missing_skills or []) if isinstance(s, str) and s.strip()]

    overview = (
        f"30-day learning roadmap for {target_job_role} in {branch or 'your branch'}. "
        "Focus each week on a subset of missing skills and practice with small projects."
    )

    weeks: List[Dict[str, Any]] = []
    chunk_size = max(1, len(skills_list) // 4 or 1)
    for i in range(0, len(skills_list) or 1, chunk_size):
        week_index = len(weeks) + 1
        chunk = skills_list[i:i + chunk_size] or skills_list
        weeks.append({
            "week": week_index,
            "focus_skills": chunk,
            "goals": [
                f"Learn fundamentals of {skill}" for skill in chunk
            ],
            "suggested_tasks": [
                f"Complete a mini project or exercise using {skill}." for skill in chunk
            ],
        })

    action_plan = {
        "overview": overview,
        "weeks": weeks,
    }

    return {
        "error": False,
        "message": "Action plan generated successfully.",
        "action_plan": action_plan,
        "tokens_used": 0,
    }
