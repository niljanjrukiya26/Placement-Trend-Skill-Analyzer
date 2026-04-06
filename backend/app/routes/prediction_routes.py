"""Prediction API routes."""

import logging

from flask import Blueprint, current_app, request
from pymongo.errors import PyMongoError

from app.services.prediction_service import (
    predict_domainwise,
    predict_dynamic_rf_score,
    train_dynamic_rf_model,
)
from app.utils import error_response, success_response


logger = logging.getLogger(__name__)

prediction_bp = Blueprint('prediction', __name__)

RANK_WEIGHT_TEMPLATE = [0.5, 0.3, 0.2]


@prediction_bp.route('/predict-placement/<userid>', methods=['GET'])
def predict_placement(userid):
    """Return domain-wise and overall placement prediction for a student."""
    try:
        db = current_app.mongo_db
        student = db.students.find_one({'userid': userid}, {'_id': 0})

        if not student:
            return error_response('Student not found', 404)

        prediction = predict_domainwise(student, db)
        return success_response(prediction, 'Placement prediction generated successfully', 200)

    except PyMongoError as exc:
        logger.exception('MongoDB error for userid=%s', userid)
        return error_response(f'Database error: {str(exc)}', 500)
    except Exception as exc:
        logger.exception('Prediction failed for userid=%s', userid)
        return error_response(f'Server error: {str(exc)}', 500)


@prediction_bp.route('/api/predict-placement/advanced', methods=['POST'])
def predict_placement_advanced():
    """Return advanced weighted placement score from domain scores, cgpa, and backlogs."""
    try:
        payload = request.get_json(silent=True) or {}

        domain_scores = payload.get('domain_scores')
        if not isinstance(domain_scores, dict) or not domain_scores:
            return error_response('domain_scores must be a non-empty object', 400)

        try:
            cgpa = float(payload.get('cgpa'))
        except (TypeError, ValueError):
            return error_response('cgpa must be a valid number', 400)

        try:
            backlogs = int(payload.get('backlogs'))
        except (TypeError, ValueError):
            return error_response('backlogs must be a valid integer', 400)

        if backlogs < 0:
            return error_response('backlogs cannot be negative', 400)

        normalized_scores = {}
        for domain, score in domain_scores.items():
            if not isinstance(domain, str) or not domain.strip():
                continue
            try:
                normalized_scores[domain.strip()] = float(score)
            except (TypeError, ValueError):
                return error_response(f'Invalid score for domain: {domain}', 400)

        if not normalized_scores:
            return error_response('domain_scores must contain valid numeric entries', 400)

        best_domain = max(normalized_scores, key=normalized_scores.get)

        ordered_domains = sorted(
            normalized_scores.items(),
            key=lambda item: float(item[1]),
            reverse=True,
        )

        raw_weights = {}
        for index, (domain, _) in enumerate(ordered_domains):
            raw_weights[domain] = RANK_WEIGHT_TEMPLATE[index] if index < len(RANK_WEIGHT_TEMPLATE) else 0.2

        total_weight = sum(raw_weights.values()) or 1.0
        normalized_weights = {
            domain: weight / total_weight
            for domain, weight in raw_weights.items()
        }

        weighted_domain_score = sum(
            score * normalized_weights.get(domain, 0.0)
            for domain, score in normalized_scores.items()
        )

        cgpa_score = (cgpa / 10.0) * 100.0
        penalty = backlogs * 5.0

        overall_score = ((weighted_domain_score * 0.6) + (cgpa_score * 0.4)) - penalty
        overall_score = max(0.0, min(100.0, overall_score))

        response_data = {
            'overall_score': round(overall_score, 2),
            'best_domain': best_domain,
            'domain_scores': {key: round(value, 2) for key, value in normalized_scores.items()},
            'cgpa': round(cgpa, 2),
            'backlogs': backlogs,
        }

        return success_response(response_data, 'Advanced placement prediction generated successfully', 200)
    except Exception as exc:
        logger.exception('Advanced prediction failed')
        return error_response(f'Server error: {str(exc)}', 500)


@prediction_bp.route('/api/predict-placement/rf-dynamic/train', methods=['POST'])
def train_rf_dynamic():
    """Train RandomForestRegressor for dynamic-domain placement prediction."""
    try:
        payload = request.get_json(silent=True) or {}
        training_samples = payload.get('training_data')
        training_result = train_dynamic_rf_model(training_samples)
        return success_response(training_result, 'Dynamic RF model trained successfully', 200)
    except ValueError as exc:
        return error_response(str(exc), 400)
    except Exception as exc:
        logger.exception('Dynamic RF training failed')
        return error_response(f'Server error: {str(exc)}', 500)


@prediction_bp.route('/api/predict-placement/rf-dynamic/predict', methods=['POST'])
def predict_rf_dynamic():
    """Predict placement score using trained dynamic-domain RF regressor."""
    try:
        payload = request.get_json(silent=True) or {}
        prediction = predict_dynamic_rf_score(payload)
        return success_response(prediction, 'Dynamic RF placement prediction generated successfully', 200)
    except FileNotFoundError as exc:
        return error_response(str(exc), 404)
    except ValueError as exc:
        return error_response(str(exc), 400)
    except Exception as exc:
        logger.exception('Dynamic RF prediction failed')
        return error_response(f'Server error: {str(exc)}', 500)
