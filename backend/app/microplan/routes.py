"""
Micro Action Plan API Routes
Generates personalized weekly skill-improvement roadmap using Gemini API
"""
import os
import json
import re
import requests
from dotenv import load_dotenv
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from pymongo.errors import PyMongoError
from app.branch_utils import normalize_branch_name

load_dotenv()

microplan_bp = Blueprint('microplan', __name__, url_prefix='/api')


def _clean_string_list(values):
    """Return cleaned list of non-empty strings."""
    if isinstance(values, str):
        values = [values]
    if not isinstance(values, list):
        return []

    return [value.strip() for value in values if isinstance(value, str) and value.strip()]


def _get_student_interested_domains(student):
    """Read interested domains from supported student profile fields."""
    interested_domains = student.get('interested_domains')
    if interested_domains is None:
        interested_domains = student.get('interested_field', [])

    cleaned_domains = _clean_string_list(interested_domains)
    unique_domains = []
    seen_domains = set()

    for domain in cleaned_domains:
        domain_key = domain.lower()
        if domain_key in seen_domains:
            continue
        seen_domains.add(domain_key)
        unique_domains.append(domain)

    return unique_domains


def _get_student_technical_skills(student):
    """Read technical skills from supported student profile fields."""
    technical_skills = student.get('technical_skills')
    if technical_skills is None:
        technical_skills = student.get('skills', [])

    return _clean_string_list(technical_skills)


def _build_missing_skill_records(domain_roles, student_skill_set):
    """Build full missing-skill records for all relevant domain job roles."""
    records = []

    for role in domain_roles:
        if not isinstance(role, dict):
            continue

        domain = str(role.get('domain', '')).strip()
        job_role = str(role.get('job_role', '')).strip()
        required_skills = _clean_string_list(role.get('required_skills', []))

        if not domain or not job_role or not required_skills:
            continue

        missing_skills = [
            skill for skill in required_skills
            if skill.lower() not in student_skill_set
        ]

        if not missing_skills:
            continue

        records.append({
            'domain': domain,
            'job_role': job_role,
            'missing_skills': missing_skills,
        })

    return records


def _build_missing_skill_lookup(missing_skill_records):
    """Create lookup for missing skills by domain and job role."""
    lookup = {}

    for record in missing_skill_records:
        domain = record.get('domain', '').strip().lower()
        job_role = record.get('job_role', '').strip().lower()
        missing_skills = _clean_string_list(record.get('missing_skills', []))

        if not domain or not job_role or not missing_skills:
            continue

        lookup[(domain, job_role)] = {skill.lower(): skill for skill in missing_skills}

    return lookup


def _extract_request_missing_skill_records(payload):
    """Read optional domain analysis payload containing only missing skills."""
    domain_analysis = payload.get('domain_analysis', []) if isinstance(payload, dict) else []
    if not isinstance(domain_analysis, list):
        return []

    requested_records = []

    for domain_block in domain_analysis:
        if not isinstance(domain_block, dict):
            continue

        domain = str(domain_block.get('domain', '')).strip()
        job_roles = domain_block.get('job_roles', [])
        if not domain or not isinstance(job_roles, list):
            continue

        for role in job_roles:
            if not isinstance(role, dict):
                continue

            job_role = str(role.get('job_role', '')).strip()
            missing_skills = _clean_string_list(role.get('missing_skills', []))

            if not job_role or not missing_skills:
                continue

            requested_records.append({
                'domain': domain,
                'job_role': job_role,
                'missing_skills': missing_skills,
            })

    return requested_records


def _align_with_requested_missing_skills(computed_records, requested_records):
    """Restrict computed records to the missing-skill view provided by the current Skill Gap page state."""
    if not requested_records:
        return computed_records

    computed_lookup = _build_missing_skill_lookup(computed_records)
    aligned_records = []

    for requested_record in requested_records:
        domain = requested_record.get('domain', '').strip()
        job_role = requested_record.get('job_role', '').strip()
        key = (domain.lower(), job_role.lower())

        if key not in computed_lookup:
            continue

        computed_missing_skills = computed_lookup[key]
        filtered_missing_skills = []

        for skill in _clean_string_list(requested_record.get('missing_skills', [])):
            matched_skill = computed_missing_skills.get(skill.lower())
            if matched_skill and matched_skill not in filtered_missing_skills:
                filtered_missing_skills.append(matched_skill)

        if not filtered_missing_skills:
            continue

        aligned_records.append({
            'domain': domain,
            'job_role': job_role,
            'missing_skills': filtered_missing_skills,
        })

    return aligned_records


def _build_microplan_prompt(missing_skill_records):
    """Build the Gemini prompt for missing-skill-only micro action plan generation."""
    structured_data = json.dumps(missing_skill_records, indent=2)

    prompt_sections = [
        'Generate a practical personalized micro action plan for a student.',
        'Only focus on improving the missing skills listed.',
        'Group output by domain and then by job role.',
        'For each job role give:',
        '- Title',
        '- Duration (for example, a 4-week roadmap)',
        '- Weekly breakdown',
        '- Daily tasks',
        '- Mini project',
        '- Week wise learning roadmap for 4 weeks',
        '- Daily actionable tasks',
        '- Small project suggestion',
        'Keep answer structured and clean.',
        'Do not mention matched skills or already known skills.',
        'Structured missing skill data:',
        structured_data,
    ]

    return '\n\n'.join(prompt_sections)


def _group_records_by_domain(missing_skill_records):
    """Group records by domain in stable insertion order."""
    grouped = {}

    for record in missing_skill_records:
        domain = record.get('domain', '').strip()
        if not domain:
            continue
        grouped.setdefault(domain, []).append(record)

    return grouped


def _build_domain_prompt(domain, domain_records, simplified=False):
    """Build Gemini prompt for one domain at a time."""
    structured_data = json.dumps(domain_records, indent=2)

    if simplified:
        lines = [
            'Create a 4-week practical micro action plan in plain text only.',
            'Focus only on missing skills from this domain data.',
            'No markdown, no JSON, no code block formatting.',
            'Use simple lines and short bullet-like text.',
            f'Domain: {domain}',
            'Data:',
            structured_data,
        ]
        return '\n\n'.join(lines)

    lines = [
        'Generate a practical personalized micro action plan for a student.',
        'Only focus on improving the missing skills listed.',
        'Group output by job role inside this domain.',
        'For each job role include: Title, Duration, weekly roadmap, daily tasks, and mini project.',
        'Return plain text only.',
        'Do not use markdown, headings syntax, tables, code blocks, or JSON.',
        'Keep output structured and clean using readable text lines only.',
        f'Domain: {domain}',
        'Structured missing skill data for this domain:',
        structured_data,
    ]
    return '\n\n'.join(lines)


def _extract_plan_text_and_finish_reason(response_json):
    """Extract generated text and finish reason from Gemini response."""
    if not isinstance(response_json, dict):
        return '', ''

    candidates = response_json.get('candidates', [])
    if not candidates or not isinstance(candidates, list):
        return '', ''

    first_candidate = candidates[0] if isinstance(candidates[0], dict) else {}
    finish_reason = first_candidate.get('finishReason', '') or ''
    content = first_candidate.get('content', {}) if isinstance(first_candidate, dict) else {}
    parts = content.get('parts', []) if isinstance(content, dict) else []
    if not parts or not isinstance(parts, list):
        return '', finish_reason

    text_segments = [
        part.get('text', '').strip()
        for part in parts
        if isinstance(part, dict) and isinstance(part.get('text', ''), str)
    ]

    return '\n'.join([segment for segment in text_segments if segment]), finish_reason


def _is_empty_or_truncated(plan_text, finish_reason):
    """Detect empty or likely-truncated model output."""
    stripped = (plan_text or '').strip()
    if not stripped:
        return True

    if str(finish_reason).upper() == 'MAX_TOKENS':
        return True

    return stripped.endswith('...')


def _strip_markdown_formatting(plan_text):
    """Remove common markdown tokens to keep output plain text."""
    text = str(plan_text or '')
    text = re.sub(r'```[\s\S]*?```', '', text)
    text = re.sub(r'`([^`]*)`', r'\1', text)
    text = re.sub(r'^\s{0,3}#{1,6}\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'__([^_]+)__', r'\1', text)
    text = re.sub(r'\*([^*]+)\*', r'\1', text)
    text = re.sub(r'_([^_]+)_', r'\1', text)
    text = re.sub(r'^\s*[-*+]\s+', '- ', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\.\s+', '- ', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


def _call_gemini_for_prompt(gemini_url, prompt):
    """Call Gemini and return raw response details."""
    gemini_body = {
        'contents': [
            {
                'parts': [
                    {'text': prompt}
                ]
            }
        ],
        'generationConfig': {
            'temperature': 0.4,
            'maxOutputTokens': 8192
        }
    }

    response = requests.post(
        gemini_url,
        json=gemini_body,
        headers={'Content-Type': 'application/json'},
        timeout=120
    )

    response_text = response.text if isinstance(response.text, str) else str(response.text)
    print(f'Gemini status code: {response.status_code}')
    print(f'Gemini response length: {len(response_text)}')
    print(f'Gemini raw response: {response_text}')

    return response


def _generate_plan_from_records(api_key, missing_skill_records):
    """Generate and merge domain-wise plan text from missing-skill records."""
    gemini_url = (
        'https://generativelanguage.googleapis.com/v1/models/'
        f'gemini-2.5-flash:generateContent?key={api_key}'
    )

    domain_groups = _group_records_by_domain(missing_skill_records)
    merged_plan_sections = []

    for domain, domain_records in domain_groups.items():
        primary_prompt = _build_domain_prompt(domain, domain_records, simplified=False)
        response = _call_gemini_for_prompt(gemini_url, primary_prompt)

        if response.status_code != 200:
            error_message = f'Gemini API returned status {response.status_code}'
            try:
                error_json = response.json()
                api_error = error_json.get('error', {}) if isinstance(error_json, dict) else {}
                if isinstance(api_error, dict) and api_error.get('message'):
                    error_message = api_error['message']
            except ValueError:
                pass
            return '', f'{domain}: {error_message}'

        try:
            response_json = response.json()
        except ValueError:
            return '', f'{domain}: Invalid JSON response from Gemini'

        plan_text, finish_reason = _extract_plan_text_and_finish_reason(response_json)

        if _is_empty_or_truncated(plan_text, finish_reason):
            print(f'Gemini fallback retry for domain: {domain}')
            retry_prompt = _build_domain_prompt(domain, domain_records, simplified=True)
            retry_response = _call_gemini_for_prompt(gemini_url, retry_prompt)

            if retry_response.status_code != 200:
                error_message = f'Gemini API returned status {retry_response.status_code}'
                try:
                    error_json = retry_response.json()
                    api_error = error_json.get('error', {}) if isinstance(error_json, dict) else {}
                    if isinstance(api_error, dict) and api_error.get('message'):
                        error_message = api_error['message']
                except ValueError:
                    pass
                return '', f'{domain}: retry failed - {error_message}'

            try:
                retry_json = retry_response.json()
            except ValueError:
                return '', f'{domain}: Invalid JSON response from Gemini on retry'

            plan_text, finish_reason = _extract_plan_text_and_finish_reason(retry_json)

            if _is_empty_or_truncated(plan_text, finish_reason):
                return '', f'{domain}: Gemini returned empty or truncated content after retry'

        cleaned_domain_plan = _strip_markdown_formatting(plan_text)
        if not cleaned_domain_plan:
            return '', f'{domain}: Gemini content was empty after plain-text cleanup'

        merged_plan_sections.append(cleaned_domain_plan)

    merged_plan = '\n\n'.join(merged_plan_sections).strip()
    if not merged_plan:
        return '', 'Gemini did not return any usable plan content'

    return merged_plan, ''


@microplan_bp.route('/micro-action-plan', methods=['POST'])
@jwt_required()
def generate_micro_action_plan():
    """Generate personalized micro action plan from the logged-in student's full profile."""
    try:
        payload = request.get_json(silent=True) or {}
        claims = get_jwt()
        if claims.get('role') != 'Student':
            return jsonify({
                'success': False,
                'gemini_error': 'Only students can generate a micro action plan'
            }), 403

        user_id = get_jwt_identity()
        db = current_app.mongo_db

        student = db.students.find_one({'userid': user_id})
        if not student:
            return jsonify({
                'success': False,
                'gemini_error': 'Student profile not found'
            }), 404

        student_branch = normalize_branch_name(student.get('branch', ''))
        interested_domains = _get_student_interested_domains(student)
        technical_skills = _get_student_technical_skills(student)
        technical_skill_set = {skill.lower() for skill in technical_skills}

        if not student_branch:
            return jsonify({
                'success': False,
                'gemini_error': 'Student branch is missing from profile'
            }), 400

        if not interested_domains:
            return jsonify({
                'success': False,
                'gemini_error': 'Student has no selected domains in profile'
            }), 400

        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return jsonify({
                'success': False,
                'gemini_error': 'Missing GEMINI_API_KEY in environment'
            }), 500

        query = {
            'eligible_branches': student_branch,
            'domain': {'$in': interested_domains},
        }

        domain_roles = list(db.domain_job_roles.find(query, {'_id': 0}))
        if not domain_roles:
            return jsonify({
                'success': False,
                'gemini_error': 'No eligible job roles found for the student profile'
            }), 404

        missing_skill_records = _build_missing_skill_records(domain_roles, technical_skill_set)
        requested_missing_skill_records = _extract_request_missing_skill_records(payload)
        missing_skill_records = _align_with_requested_missing_skills(
            missing_skill_records,
            requested_missing_skill_records,
        )

        if not missing_skill_records:
            return jsonify({
                'success': False,
                'gemini_error': 'No missing skills found across selected domains and job roles'
            }), 400

        print(f'Micro plan job roles included: {len(missing_skill_records)}')
        print(f'Micro plan student branch: {student_branch}')
        print(f'Micro plan domains: {interested_domains}')

        plan_text, generation_error = _generate_plan_from_records(api_key, missing_skill_records)
        if generation_error:
            return jsonify({
                'success': False,
                'gemini_error': generation_error
            }), 502

        return jsonify({
            'success': True,
            'plan': plan_text
        }), 200

    except PyMongoError as db_error:
        return jsonify({
            'success': False,
            'gemini_error': f'Database error: {str(db_error)}'
        }), 500
    except requests.Timeout:
        print('Gemini request timed out after 120 seconds')
        return jsonify({
            'success': False,
            'gemini_error': 'Gemini request timed out after 120 seconds'
        }), 504
    except requests.RequestException as req_error:
        return jsonify({
            'success': False,
            'gemini_error': f'Request error: {str(req_error)}'
        }), 502
    except Exception as error:
        return jsonify({
            'success': False,
            'gemini_error': str(error)
        }), 500


@microplan_bp.route('/generate-micro-plan', methods=['POST'])
@jwt_required()
def generate_micro_plan_for_selected_role():
    """Generate micro action plan for one selected job role payload from the UI."""
    try:
        claims = get_jwt()
        if claims.get('role') != 'Student':
            return jsonify({
                'success': False,
                'gemini_error': 'Only students can generate a micro action plan'
            }), 403

        payload = request.get_json(silent=True) or {}
        domain = str(payload.get('domain', '')).strip()
        job_role = str(payload.get('job_role', '')).strip()
        missing_skills = _clean_string_list(payload.get('missing_skills', []))

        if not domain or not job_role:
            return jsonify({
                'success': False,
                'gemini_error': 'domain and job_role are required'
            }), 400

        if not missing_skills:
            return jsonify({
                'success': False,
                'gemini_error': 'Please select a job role with missing skills'
            }), 400

        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return jsonify({
                'success': False,
                'gemini_error': 'Missing GEMINI_API_KEY in environment'
            }), 500

        missing_skill_records = [{
            'domain': domain,
            'job_role': job_role,
            'missing_skills': missing_skills,
        }]

        print(f'Selected role micro plan request: {domain} - {job_role}')
        print(f'Selected role missing skills count: {len(missing_skills)}')

        plan_text, generation_error = _generate_plan_from_records(api_key, missing_skill_records)
        if generation_error:
            return jsonify({
                'success': False,
                'gemini_error': generation_error
            }), 502

        return jsonify({
            'success': True,
            'plan': plan_text
        }), 200

    except requests.Timeout:
        print('Gemini request timed out after 120 seconds')
        return jsonify({
            'success': False,
            'gemini_error': 'Gemini request timed out after 120 seconds'
        }), 504
    except requests.RequestException as req_error:
        return jsonify({
            'success': False,
            'gemini_error': f'Request error: {str(req_error)}'
        }), 502
    except Exception as error:
        return jsonify({
            'success': False,
            'gemini_error': str(error)
        }), 500
