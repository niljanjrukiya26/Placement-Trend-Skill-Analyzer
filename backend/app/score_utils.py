"""Score utility functions for student profile readiness."""

from datetime import datetime


def calculate_score(student, db):
    """Calculate score using the same logic as placement prediction page."""
    try:
        from app.services.prediction_service import predict_domainwise

        prediction = predict_domainwise(student or {}, db) or {}
        score = prediction.get('overall_probability', 0)
        return round(max(0.0, min(100.0, float(score))), 2)
    except Exception:
        return 0.0


def update_student_score(db, student_id):
    """Recompute and persist overall_prediction_score for a student_id."""
    if not student_id:
        return None

    student = db.students.find_one({'student_id': student_id})
    if not student:
        return None

    score = calculate_score(student, db)
    db.students.update_one(
        {'student_id': student_id},
        {'$set': {'overall_prediction_score': score, 'last_updated': datetime.utcnow()}},
    )
    return score
