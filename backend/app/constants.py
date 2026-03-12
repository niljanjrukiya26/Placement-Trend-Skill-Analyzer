# Backend configuration and utilities
MONGODB_COLLECTIONS = {
    'users': 'User accounts with authentication',
    'students': 'Student profiles with academic details',
    'placement_records': 'Placement outcomes and records',
    'companies': 'Company information and job openings',
    'job_roles': 'Job role templates with requirements',
    'domain_job_roles': 'Domain-wise job role templates with branch eligibility',
    'tpo': 'TPO officer profiles'
}

# Default pagination
DEFAULT_LIMIT = 10
MAX_LIMIT = 50
