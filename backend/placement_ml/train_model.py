"""Train placement model using cgpa, backlogs and domain from placement_records."""

import os
import pickle

from dotenv import load_dotenv
from pymongo import MongoClient
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


load_dotenv()

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MODEL_PATH = os.path.join(BASE_DIR, 'placement_ml', 'placement_model.pkl')
ENCODER_PATH = os.path.join(BASE_DIR, 'placement_ml', 'domain_encoder.pkl')


def _extract_rows(db):
    records = list(db.placement_records.find({}, {
        '_id': 0,
        'cgpa': 1,
        'backlogs': 1,
        'domain': 1,
        'placed_status': 1,
    }))

    base_features = []
    targets = []
    domains = []
    student_cache = {}

    for row in records:
        domain = row.get('domain')
        placed_status = row.get('placed_status')

        if not isinstance(domain, str) or not domain.strip() or placed_status is None:
            continue

        cgpa_raw = row.get('cgpa')
        backlogs_raw = row.get('backlogs')

        if cgpa_raw is None or backlogs_raw is None:
            student_id = row.get('student_id')
            if isinstance(student_id, str) and student_id.strip():
                sid = student_id.strip()
                if sid not in student_cache:
                    student_cache[sid] = db.students.find_one(
                        {'student_id': sid},
                        {'_id': 0, 'cgpa': 1, 'backlogs': 1}
                    ) or {}
                profile = student_cache[sid]
                if cgpa_raw is None:
                    cgpa_raw = profile.get('cgpa')
                if backlogs_raw is None:
                    backlogs_raw = profile.get('backlogs')

        try:
            cgpa = float(cgpa_raw)
            backlogs = int(float(backlogs_raw))
        except (TypeError, ValueError):
            continue

        base_features.append([cgpa, float(backlogs)])
        targets.append(1 if bool(placed_status) else 0)
        domains.append(domain.strip())

    return base_features, targets, domains


def train_and_save_model(db):
    base_features, targets, domains = _extract_rows(db)

    if len(base_features) < 2 or len(set(targets)) < 2:
        raise ValueError('Not enough valid placement_records with both classes for training')

    encoder = LabelEncoder()
    encoded_domains = encoder.fit_transform(domains)

    features = [
        [row[0], row[1], float(encoded)]
        for row, encoded in zip(base_features, encoded_domains)
    ]

    test_size = 0.2 if len(features) >= 10 else 0.5
    x_train, x_test, y_train, y_test = train_test_split(
        features,
        targets,
        test_size=test_size,
        random_state=42,
        stratify=targets,
    )

    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f'Model accuracy: {accuracy:.4f}')

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, 'wb') as model_file:
        pickle.dump(model, model_file)

    with open(ENCODER_PATH, 'wb') as encoder_file:
        pickle.dump(encoder, encoder_file)

    return {
        'accuracy': float(accuracy),
        'records_used': len(features),
        'model_path': MODEL_PATH,
        'encoder_path': ENCODER_PATH,
    }


def main():
    mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    db_name = os.getenv('DB_NAME', 'placement_trend_skill_db')

    client = MongoClient(mongodb_uri)
    try:
        db = client[db_name]
        result = train_and_save_model(db)
        print(f"Training complete. Records used: {result['records_used']}")
    finally:
        client.close()


if __name__ == '__main__':
    main()
