export const ROLES = {
  MAIN_TPO: 'MAIN_TPO',
  BRANCH_TPO: 'BRANCH_TPO',
};

export const PAGE_KEYS = {
  DASHBOARD: 'dashboard',
  MANAGE_TPO: 'manage-tpo',
  MANAGE_COMPANY: 'manage-company',
  COMPANIES: 'companies',
  JOB_ROLES: 'job-roles',
  STUDENTS: 'students',
  PLACEMENT_RECORDS: 'placement-records',
  ANALYTICS: 'analytics',
  SKILL_GAP: 'skill-gap',
};

export function normalizeRole(role) {
  if (!role) return null;
  if (role === 'TPO') return ROLES.MAIN_TPO;
  return role;
}

export function getCurrentUser() {
  const role = normalizeRole(localStorage.getItem('user_role'));
  const branch = localStorage.getItem('user_branch') || 'CSE';

  return {
    id: localStorage.getItem('user_id') || 'demo-user',
    email: localStorage.getItem('user_email') || 'tpo@college.edu',
    role: role || ROLES.MAIN_TPO,
    branch,
  };
}

export function canAccessPage(role, pageKey) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === ROLES.MAIN_TPO) {
    return [
      PAGE_KEYS.DASHBOARD,
      PAGE_KEYS.MANAGE_TPO,
      PAGE_KEYS.MANAGE_COMPANY,
      PAGE_KEYS.COMPANIES,
      PAGE_KEYS.JOB_ROLES,
      PAGE_KEYS.STUDENTS,
      PAGE_KEYS.PLACEMENT_RECORDS,
      PAGE_KEYS.ANALYTICS,
    ].includes(pageKey);
  }

  if (normalizedRole === ROLES.BRANCH_TPO) {
    return [
      PAGE_KEYS.DASHBOARD,
      PAGE_KEYS.COMPANIES,
      PAGE_KEYS.STUDENTS,
      PAGE_KEYS.PLACEMENT_RECORDS,
      PAGE_KEYS.SKILL_GAP,
    ].includes(pageKey);
  }

  return false;
}
