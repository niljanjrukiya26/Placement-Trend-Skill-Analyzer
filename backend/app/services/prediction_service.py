"""Placement prediction service with domain readiness and weighted scoring."""

import logging
import os
import pickle
import re
from typing import Any, Dict, List, Set, Tuple

from sklearn.ensemble import RandomForestClassifier
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder


logger = logging.getLogger(__name__)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MODEL_DIR = os.path.join(BASE_DIR, 'placement_ml')
MODEL_PATH = os.path.join(MODEL_DIR, 'placement_model.pkl')
ENCODER_PATH = os.path.join(MODEL_DIR, 'domain_encoder.pkl')
RF_DYNAMIC_MODEL_PATH = os.path.join(MODEL_DIR, 'rf_dynamic_model.pkl')

RANK_WEIGHT_TEMPLATE = [0.5, 0.3, 0.2]


def _normalize_skills(skills: List[str]) -> Set[str]:
    normalized = set()
    for skill in skills or []:
        if isinstance(skill, str) and skill.strip():
            normalized.add(skill.strip().lower())
    return normalized


def _normalize_domains(domains: Any) -> Set[str]:
    values: List[str] = []

    if isinstance(domains, list):
        values = [d for d in domains if isinstance(d, str)]
    elif isinstance(domains, str):
        values = [x.strip() for x in domains.split(',') if x.strip()]

    return {d.strip().lower() for d in values if d and d.strip()}


def _top_domain_scores_vector(domain_scores: Dict[str, Any], top_k: int = 5) -> List[float]:
    """Convert dynamic domain score map to fixed-length top-k vector."""
    if not isinstance(domain_scores, dict):
        return [0.0] * top_k

    numeric_scores: List[float] = []
    for value in domain_scores.values():
        try:
            score = float(value)
        except (TypeError, ValueError):
            continue
        score = max(0.0, min(100.0, score))
        numeric_scores.append(score)

    numeric_scores.sort(reverse=True)
    vector = numeric_scores[:top_k]
    if len(vector) < top_k:
        vector.extend([0.0] * (top_k - len(vector)))
    return vector


def _build_dynamic_rf_feature(sample: Dict[str, Any]) -> List[float]:
    """Build [top5 domain scores, cgpa, backlogs] feature vector."""
    domain_vector = _top_domain_scores_vector(sample.get('domain_scores') or {}, top_k=5)

    try:
        cgpa = float(sample.get('cgpa', 0) or 0)
    except (TypeError, ValueError):
        cgpa = 0.0
    cgpa = max(0.0, min(10.0, cgpa))

    try:
        backlogs = int(float(sample.get('backlogs', 0) or 0))
    except (TypeError, ValueError):
        backlogs = 0
    backlogs = max(0, backlogs)

    return [*domain_vector, cgpa, float(backlogs)]


def train_dynamic_rf_model(training_samples: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Train RandomForestRegressor using dynamic top-domain vectors."""
    if not isinstance(training_samples, list) or not training_samples:
        raise ValueError('training_samples must be a non-empty list')

    X: List[List[float]] = []
    y: List[float] = []

    for sample in training_samples:
        if not isinstance(sample, dict):
            continue
        if sample.get('overall_score') is None:
            continue

        try:
            target_score = float(sample.get('overall_score'))
        except (TypeError, ValueError):
            continue

        target_score = max(0.0, min(100.0, target_score)) / 100.0

        X.append(_build_dynamic_rf_feature(sample))
        y.append(target_score)

    if len(X) < 2:
        raise ValueError('At least 2 valid training samples are required')

    model = RandomForestRegressor(n_estimators=300, random_state=42)
    model.fit(X, y)

    os.makedirs(MODEL_DIR, exist_ok=True)
    with open(RF_DYNAMIC_MODEL_PATH, 'wb') as model_file:
        pickle.dump(model, model_file)

    return {
        'samples_used': len(X),
        'feature_length': len(X[0]),
        'model_path': RF_DYNAMIC_MODEL_PATH,
    }


def predict_dynamic_rf_score(student_payload: Dict[str, Any]) -> Dict[str, Any]:
    """Predict placement score using trained dynamic-domain RandomForestRegressor."""
    if not os.path.exists(RF_DYNAMIC_MODEL_PATH):
        raise FileNotFoundError('Dynamic RF model not found. Train the model first.')

    with open(RF_DYNAMIC_MODEL_PATH, 'rb') as model_file:
        model = pickle.load(model_file)

    domain_scores = student_payload.get('domain_scores') or {}
    if not isinstance(domain_scores, dict) or not domain_scores:
        raise ValueError('domain_scores must be a non-empty object')

    feature_vector = _build_dynamic_rf_feature(student_payload)
    prediction = float(model.predict([feature_vector])[0])

    overall_score = max(0.0, min(100.0, prediction * 100.0))

    best_domain = None
    best_score = None
    for domain, score in domain_scores.items():
        if not isinstance(domain, str) or not domain.strip():
            continue
        try:
            numeric_score = float(score)
        except (TypeError, ValueError):
            continue
        if best_score is None or numeric_score > best_score:
            best_score = numeric_score
            best_domain = domain.strip()

    return {
        'overall_score': round(overall_score, 2),
        'best_domain': best_domain,
        'domain_scores': {
            str(domain): round(max(0.0, min(100.0, float(score))), 2)
            for domain, score in domain_scores.items()
            if isinstance(domain, str)
        },
        'cgpa': round(max(0.0, min(10.0, float(student_payload.get('cgpa', 0) or 0))), 2),
        'backlogs': max(0, int(float(student_payload.get('backlogs', 0) or 0))),
    }


def _build_training_rows(db) -> Tuple[List[List[float]], List[int], List[str]]:
    records = list(db.placement_records.find({}, {
        '_id': 0,
        'cgpa': 1,
        'backlogs': 1,
        'domain': 1,
        'placed_status': 1,
    }))

    feature_rows: List[List[float]] = []
    targets: List[int] = []
    domains: List[str] = []
    student_cache: Dict[str, Dict[str, Any]] = {}

    for row in records:
        domain = row.get('domain')
        if not isinstance(domain, str) or not domain.strip():
            continue

        placed_status = row.get('placed_status')
        if placed_status is None:
            continue

        cgpa_raw = row.get('cgpa')
        backlogs_raw = row.get('backlogs')

        # Backfill missing training features from student profile when needed.
        if cgpa_raw is None or backlogs_raw is None:
            student_id = row.get('student_id')
            if isinstance(student_id, str) and student_id.strip():
                cache_key = student_id.strip()
                if cache_key not in student_cache:
                    student_cache[cache_key] = db.students.find_one(
                        {'student_id': cache_key},
                        {'_id': 0, 'cgpa': 1, 'backlogs': 1}
                    ) or {}

                profile = student_cache.get(cache_key, {})
                if cgpa_raw is None:
                    cgpa_raw = profile.get('cgpa')
                if backlogs_raw is None:
                    backlogs_raw = profile.get('backlogs')

        try:
            cgpa = float(cgpa_raw)
            backlogs = int(float(backlogs_raw))
        except (TypeError, ValueError):
            continue

        domains.append(domain.strip())
        feature_rows.append([cgpa, float(backlogs)])
        targets.append(1 if bool(placed_status) else 0)

    return feature_rows, targets, domains


def _train_and_save_model_if_needed(db) -> bool:
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
        return True

    base_features, targets, domains = _build_training_rows(db)
    if len(base_features) < 2 or len(set(targets)) < 2:
        logger.warning('Insufficient placement_records for ML training; falling back to readiness-only prediction')
        return False

    encoder = LabelEncoder()
    encoded_domains = encoder.fit_transform(domains)

    features = []
    for row, encoded_domain in zip(base_features, encoded_domains):
        features.append([row[0], row[1], float(encoded_domain)])

    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(features, targets)

    os.makedirs(MODEL_DIR, exist_ok=True)
    with open(MODEL_PATH, 'wb') as model_file:
        pickle.dump(model, model_file)

    with open(ENCODER_PATH, 'wb') as encoder_file:
        pickle.dump(encoder, encoder_file)

    logger.info('Prediction model trained and saved to %s', MODEL_DIR)
    return True


def _load_model_and_encoder(db):
    trained_or_available = _train_and_save_model_if_needed(db)
    if not trained_or_available:
        return None, None

    with open(MODEL_PATH, 'rb') as model_file:
        model = pickle.load(model_file)

    with open(ENCODER_PATH, 'rb') as encoder_file:
        encoder = pickle.load(encoder_file)

    return model, encoder


def get_domain_readiness(student_skills: List[str], db) -> Dict[str, float]:
    """Return readiness percentage per domain based on required skills match."""
    normalized_student_skills = _normalize_skills(student_skills)

    pipeline = [
        {
            '$group': {
                '_id': '$domain',
                'role_skill_lists': {'$push': '$required_skills'}
            }
        }
    ]

    grouped_domains = list(db.domain_job_roles.aggregate(pipeline))
    readiness_map: Dict[str, float] = {}

    for row in grouped_domains:
        domain = row.get('_id')
        if not isinstance(domain, str) or not domain.strip():
            continue

        domain_skill_pool: Set[str] = set()
        for role_skills in row.get('role_skill_lists', []) or []:
            if not isinstance(role_skills, list):
                continue
            for skill in role_skills:
                if isinstance(skill, str) and skill.strip():
                    domain_skill_pool.add(skill.strip().lower())

        if not domain_skill_pool:
            readiness_map[domain] = 0.0
            continue

        matched = len(normalized_student_skills.intersection(domain_skill_pool))
        readiness = (matched / len(domain_skill_pool)) * 100
        readiness_map[domain] = round(readiness, 2)

    return readiness_map


def _placed_probability(model, feature_vector: List[List[float]]) -> float:
    probabilities = model.predict_proba(feature_vector)[0]
    classes = list(model.classes_)

    if 1 in classes:
        return float(probabilities[classes.index(1)])
    if True in classes:
        return float(probabilities[classes.index(True)])
    return float(probabilities[0])


def _profile_adjusted_readiness(readiness: float, cgpa: float, backlogs: int) -> float:
    """Fallback estimator that still uses student cgpa and backlogs."""
    safe_readiness = max(0.0, min(100.0, float(readiness))) / 100.0
    safe_cgpa = max(0.0, min(10.0, float(cgpa))) / 10.0
    backlog_penalty = max(0.0, 1.0 - (0.08 * max(0, int(backlogs))))

    # Weighted fallback score with explicit profile signal.
    score = (0.55 * safe_readiness) + (0.35 * safe_cgpa) + (0.10 * backlog_penalty)
    score *= backlog_penalty
    return max(0.0, min(1.0, score))


def _filter_domains_for_student(domain_probabilities: Dict[str, float],
                                readiness_map: Dict[str, float],
                                selected_domains: Any) -> Dict[str, float]:
    selected_domain_set = _normalize_domains(selected_domains)
    if not selected_domain_set:
        # If student has not selected domains yet, show all domains with readiness > 0.
        return {
            domain: round(float(probability), 2)
            for domain, probability in domain_probabilities.items()
            if float(readiness_map.get(domain, 0.0)) > 0
        }

    filtered: Dict[str, float] = {}
    for domain, probability in domain_probabilities.items():
        readiness = float(readiness_map.get(domain, 0.0))
        if readiness <= 0:
            continue
        if domain.strip().lower() not in selected_domain_set:
            continue
        filtered[domain] = round(float(probability), 2)

    # If selected_domains do not match model domains (naming mismatch), avoid blank UI.
    if not filtered:
        logger.warning('selected_domains did not match predicted domains; falling back to readiness>0 domains')
        return {
            domain: round(float(probability), 2)
            for domain, probability in domain_probabilities.items()
            if float(readiness_map.get(domain, 0.0)) > 0
        }

    return filtered


def _advanced_overall_score(domain_scores: Dict[str, float], cgpa: float, backlogs: int) -> float:
    if not domain_scores:
        return 0.0

    ordered_domains = sorted(
        domain_scores.items(),
        key=lambda item: float(item[1]),
        reverse=True,
    )

    raw_weights: Dict[str, float] = {}
    for index, (domain, _) in enumerate(ordered_domains):
        raw_weights[domain] = RANK_WEIGHT_TEMPLATE[index] if index < len(RANK_WEIGHT_TEMPLATE) else 0.2

    total_weight = sum(raw_weights.values()) or 1.0
    normalized_weights = {
        domain: weight / total_weight
        for domain, weight in raw_weights.items()
    }

    weighted_domain_score = sum(
        float(score) * normalized_weights.get(domain, 0.0)
        for domain, score in domain_scores.items()
    )
    cgpa_score = (max(0.0, min(10.0, float(cgpa))) / 10.0) * 100.0
    penalty = max(0, int(backlogs)) * 5.0

    overall = ((weighted_domain_score * 0.6) + (cgpa_score * 0.4)) - penalty
    return round(max(0.0, min(100.0, overall)), 2)


def get_compatible_companies(best_domain: Any, student_cgpa: float, db) -> List[Dict[str, Any]]:
    """Fetch compatible companies directly from companies collection by domain and CGPA."""
    if not isinstance(best_domain, str) or not best_domain.strip():
        return []

    target_domain = best_domain.strip()

    escaped_domain = re.escape(target_domain)

    try:
        safe_cgpa = float(student_cgpa)
    except (TypeError, ValueError):
        safe_cgpa = 0.0

    companies = list(db.companies.find(
        {
            'domain': {'$elemMatch': {'$regex': f'^{escaped_domain}$', '$options': 'i'}},
            'required_cgpa': {'$lte': safe_cgpa},
        },
        {
            '_id': 0,
            'company_id': 1,
            'company_name': 1,
            'required_cgpa': 1,
            'min_pkg': 1,
            'minimum_pkg': 1,
            'max_pkg': 1,
        }
    ))

    compatible: List[Dict[str, Any]] = []
    for company in companies:
        compatible.append({
            'company_id': company.get('company_id'),
            'company_name': company.get('company_name'),
            'required_cgpa': company.get('required_cgpa'),
            'min_pkg': company.get('min_pkg', company.get('minimum_pkg')),
            'max_pkg': company.get('max_pkg'),
        })

    compatible.sort(key=lambda x: (str(x.get('company_name') or '')).lower())
    return compatible


def predict_domainwise(student: Dict[str, Any], db) -> Dict[str, Any]:
    """Predict domain probabilities and overall placement probability."""
    model, encoder = _load_model_and_encoder(db)

    try:
        cgpa = float(student.get('cgpa', 0) or 0)
    except (TypeError, ValueError):
        cgpa = 0.0

    try:
        backlogs = int(student.get('backlogs', 0) or 0)
    except (TypeError, ValueError):
        backlogs = 0

    student_skills = student.get('skills') or []
    if isinstance(student_skills, str):
        student_skills = [student_skills]
    # Prefer explicit selected_domains; fallback to interested_field used in student profile.
    selected_domains = student.get('selected_domains') or student.get('interested_field') or []

    readiness_map = get_domain_readiness(student_skills, db)

    if not readiness_map:
        return {
            'overall_probability': 0.0,
            'best_domain': None,
            'domain_probabilities': {},
            'compatible_companies': []
        }

    known_domains = set(str(x) for x in getattr(encoder, 'classes_', [])) if encoder is not None else set()
    domain_probabilities: Dict[str, float] = {}

    # Fallback mode: if ML artifacts cannot be trained/loaded, still include cgpa/backlogs.
    if model is None or encoder is None:
        for domain, readiness in readiness_map.items():
            fallback_probability = _profile_adjusted_readiness(readiness, cgpa, backlogs)
            domain_probabilities[domain] = round(fallback_probability * 100, 2)

        domain_probabilities = _filter_domains_for_student(
            domain_probabilities,
            readiness_map,
            selected_domains,
        )

        best_domain = max(domain_probabilities, key=domain_probabilities.get) if domain_probabilities else None
        overall_probability = _advanced_overall_score(domain_probabilities, cgpa, backlogs)
        compatible_companies = get_compatible_companies(best_domain, cgpa, db)

        return {
            'overall_probability': overall_probability,
            'best_domain': best_domain,
            'domain_probabilities': domain_probabilities,
            'compatible_companies': compatible_companies
        }

    for domain, readiness in readiness_map.items():
        ml_probability = 0.0

        if domain in known_domains:
            encoded = int(encoder.transform([domain])[0])
            feature_vector = [[cgpa, float(backlogs), float(encoded)]]
            ml_probability = _placed_probability(model, feature_vector)

        final_probability = ml_probability * (readiness / 100.0)
        domain_probabilities[domain] = round(final_probability * 100, 2)

    domain_probabilities = _filter_domains_for_student(
        domain_probabilities,
        readiness_map,
        selected_domains,
    )

    best_domain = max(domain_probabilities, key=domain_probabilities.get) if domain_probabilities else None
    overall_probability = _advanced_overall_score(domain_probabilities, cgpa, backlogs)
    compatible_companies = get_compatible_companies(best_domain, cgpa, db)

    return {
        'overall_probability': overall_probability,
        'best_domain': best_domain,
        'domain_probabilities': domain_probabilities,
        'compatible_companies': compatible_companies
    }
