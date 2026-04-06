import { mockTPOData } from '../../data/tpoMockData';
import { ROLES, normalizeRole } from './roles';

function isMainRole(role) {
  return normalizeRole(role) === ROLES.MAIN_TPO;
}

export function getScopedTPOData(user) {
  const normalizedRole = normalizeRole(user?.role);
  const branch = user?.branch || 'CSE';
  const isMain = isMainRole(normalizedRole);

  const students = isMain
    ? mockTPOData.students
    : mockTPOData.students.filter((student) => student.branch === branch);

  const placementRecords = isMain
    ? mockTPOData.placementRecords
    : mockTPOData.placementRecords.filter((record) => record.branch === branch);

  const branchTrend = mockTPOData.branchPlacementYearwise.map((row) => ({
    year: row.year,
    value: row[branch],
  }));

  const topCompanies = [...mockTPOData.companies]
    .sort((a, b) => b.hired - a.hired)
    .slice(0, 5);

  const skillGapForBranch =
    mockTPOData.topSkillsGapByBranch.find((item) => item.branch === branch) ||
    mockTPOData.topSkillsGapByBranch[0];

  return {
    isMain,
    role: normalizedRole,
    branch,
    companies: mockTPOData.companies,
    jobRoles: mockTPOData.jobRoles,
    tpos: mockTPOData.tpos,
    students,
    placementRecords,
    topCompanies,
    branchPlacementYearwise: mockTPOData.branchPlacementYearwise,
    branchTrend,
    skillGapForBranch,
  };
}
