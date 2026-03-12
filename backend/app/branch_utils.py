"""
Branch normalization helpers.
Ensures all branch comparisons use canonical full branch names.
"""

BRANCH_CODE_TO_FULL = {
    'IT': 'Information Technology',
    'CE': 'Computer Engineering',
    'CP': 'Computer Engineering',
    'COMPUTER': 'Computer Engineering',
    'ELECTRICAL': 'Electrical Engineering',
    'EE': 'Electrical Engineering',
    'CIVIL': 'Civil Engineering',
    'MECHANICAL': 'Mechanical Engineering',
}

# Include common legacy variants for safer normalization.
BRANCH_ALIAS_TO_FULL = {
    'information technology': 'Information Technology',
    'it engineering': 'Information Technology',
    'computer engineering': 'Computer Engineering',
    'computer': 'Computer Engineering',
    'computer science': 'Computer Engineering',
    'computer science engineering': 'Computer Engineering',
    'electrical engineering': 'Electrical Engineering',
    'electrical': 'Electrical Engineering',
    'civil engineering': 'Civil Engineering',
    'civil': 'Civil Engineering',
    'mechanical engineering': 'Mechanical Engineering',
    'mechanical': 'Mechanical Engineering',
}

for short_code, full_name in BRANCH_CODE_TO_FULL.items():
    BRANCH_ALIAS_TO_FULL[short_code.lower()] = full_name


def normalize_branch_name(branch_value):
    """
    Normalize a branch value to canonical full name when possible.

    Args:
        branch_value: Raw branch text from request or database.

    Returns:
        Canonical full branch name if recognized, else trimmed original string.
    """
    if not isinstance(branch_value, str):
        return ''

    branch = branch_value.strip()
    if not branch:
        return ''

    return BRANCH_ALIAS_TO_FULL.get(branch.lower(), branch)
