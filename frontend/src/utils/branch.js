// Branch normalization helper for frontend filters and comparisons.
const BRANCH_MAP = {
  IT: 'Information Technology',
  CE: 'Computer Engineering',
  CP: 'Computer Engineering',
  COMPUTER: 'Computer Engineering',
  ELECTRICAL: 'Electrical Engineering',
  EE: 'Electrical Engineering',
  CIVIL: 'Civil Engineering',
  MECHANICAL: 'Mechanical Engineering',
};

const BRANCH_ALIAS_MAP = {
  'information technology': 'Information Technology',
  'it engineering': 'Information Technology',
  'computer engineering': 'Computer Engineering',
  computer: 'Computer Engineering',
  'computer science': 'Computer Engineering',
  'computer science engineering': 'Computer Engineering',
  'electrical engineering': 'Electrical Engineering',
  electrical: 'Electrical Engineering',
  'civil engineering': 'Civil Engineering',
  civil: 'Civil Engineering',
  'mechanical engineering': 'Mechanical Engineering',
  mechanical: 'Mechanical Engineering',
};

Object.entries(BRANCH_MAP).forEach(([code, fullName]) => {
  BRANCH_ALIAS_MAP[code.toLowerCase()] = fullName;
});

export const normalizeBranchName = (branchValue) => {
  if (typeof branchValue !== 'string') return '';
  const branch = branchValue.trim();
  if (!branch) return '';
  return BRANCH_ALIAS_MAP[branch.toLowerCase()] || branch;
};

export const branchesMatch = (leftBranch, rightBranch) => {
  return normalizeBranchName(leftBranch).toLowerCase() === normalizeBranchName(rightBranch).toLowerCase();
};
