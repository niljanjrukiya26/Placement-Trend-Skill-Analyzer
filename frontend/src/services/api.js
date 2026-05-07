/**
 * API Service Module
 * Handles all REST API calls to the Flask backend
 * Includes axios instance with base URL and interceptors
 */
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authorization interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_branch');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * AUTHENTICATION APIs
 */
export const authService = {
  login: (identifier, password) =>
    apiClient.post('/auth/login', { identifier, password }),

  changePassword: (token, payload) =>
    apiClient.post('/auth/change-password', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  
  logout: () =>
    apiClient.post('/auth/logout'),
  
  validateToken: () =>
    apiClient.get('/auth/validate-token'),
};

/**
 * STUDENT APIs
 */
export const studentService = {
  getProfile: () =>
    apiClient.get('/student/profile'),
  
  updateProfile: (data) =>
    apiClient.put('/student/profile', data),
  
  getPlacementStatus: () =>
    apiClient.get('/student/placement-status'),
};

/**
 * ANALYTICS APIs
 */
export const analyticsService = {
  getYearwisePlacement: () =>
    apiClient.get('/analytics/placement/yearwise'),
  
  getBranchwisePlacement: (year) =>
    apiClient.get('/analytics/placement/branchwise', { params: { year } }),
  
  getTopSkills: (limit = 10) =>
    apiClient.get('/analytics/skills/top', { params: { limit } }),

  getSkillOptions: () =>
    apiClient.get('/analytics/skills/options'),

  getInterestedFieldOptions: () =>
    apiClient.get('/analytics/interests/options'),
  
  getJobRoles: () =>
    apiClient.get('/analytics/job-roles'),

  getDomainJobRoles: (params = {}) =>
    apiClient.get('/analytics/domain-job-roles', { params }),
  
  getCompaniesOverview: () =>
    apiClient.get('/analytics/companies/overview'),

  getPackageStatistics: () =>
    apiClient.get('/analytics/placement/package-stats'),

  getPlacementInsights: (jobRole) =>
    apiClient.get(`/placement-insights/${encodeURIComponent(jobRole)}`),
};

/**
 * TPO APIs
 */
export const tpoService = {
  getProfile: (email) =>
    apiClient.get('/tpo/profile', { params: { email } }),

  getDashboard: (email) =>
    apiClient.get('/tpo/dashboard', { params: { email } }),

  getYearStats: (email) =>
    apiClient.get('/tpo/year-stats', { params: { email } }),

  getRecentPlacements: () =>
    apiClient.get('/tpo/recent-placements'),

  getBranchStats: (email, year) =>
    apiClient.get('/tpo/branch-stats', { params: { email, year } }),
  
  getBranchStudents: () =>
    apiClient.get('/tpo/students'),

  getLeaderboard: (params = {}) =>
    apiClient.get('/tpo/leaderboard', { params }),

  addStudent: (payload) =>
    apiClient.post('/tpo/students', payload),

  updateStudent: (studentId, payload) =>
    apiClient.put(`/tpo/students/${studentId}`, payload),

  resetStudentPassword: (studentId) =>
    apiClient.post(`/tpo/students/${studentId}/reset-password`),

  deleteStudent: (studentId) =>
    apiClient.delete(`/tpo/students/${studentId}`),


  
  getPlacementRecords: (year = null) => {
    const params = year ? { year } : {};
    return apiClient.get('/tpo/placement-records', { params });
  },

  getPlacementRecordYearOptions: () =>
    apiClient.get('/tpo/placement-records/options/years'),

  getPlacementRecordCompanyOptions: (year) =>
    apiClient.get('/tpo/placement-records/options/companies', { params: { year } }),

  getPlacementRecordDomainOptions: (year, companyName) =>
    apiClient.get('/tpo/placement-records/options/domains', { params: { year, company_name: companyName } }),

  getPlacementRecordJobRoleOptions: (domain) =>
    apiClient.get('/tpo/placement-records/options/job-roles', { params: { domain } }),

  addPlacementRecord: (payload) =>
    apiClient.post('/tpo/placement-records', payload),

  updatePlacementRecord: (id, payload) =>
    apiClient.put(`/tpo/placement-records/${id}`, payload),

  deletePlacementRecord: (id) =>
    apiClient.delete(`/tpo/placement-records/${id}`),


  
  getBranchStatistics: () =>
    apiClient.get('/tpo/branch-statistics'),

  getAllTPOs: () =>
    apiClient.get('/tpo/all'),

  addTPO: (payload) =>
    apiClient.post('/tpo/add', payload),

  updateTPO: (userid, payload) =>
    apiClient.put(`/tpo/update/${userid}`, payload),

  resetTPOPassword: (userid) =>
    apiClient.post(`/tpo/${userid}/reset-password`),

  deleteTPO: (userid) =>
    apiClient.delete(`/tpo/delete/${userid}`),
};

/**
 * PLACEMENT DASHBOARD APIs
 */
export const placementService = {
  getPlacements: (params = {}) =>
    apiClient.get('/placements', { params }),

  getJobRoles: (params = {}) =>
    apiClient.get('/job-roles', { params }),

  filterPlacements: (params = {}) =>
    apiClient.get('/placements', { params }),

  getPlacementStats: () =>
    apiClient.get('/placements/stats'),

  getBranchStats: () =>
    apiClient.get('/placements/branch-stats'),
};

/**
 * SKILL GAP APIs
 */
export const skillgapService = {
  getDomainSkillGap: () =>
    apiClient.get('/skillgap/domain-analysis'),

  generateMicroActionPlan: (data) =>
    apiClient.post('/micro-action-plan', data),

  generateMicroPlanForRole: (data) =>
    apiClient.post('/generate-micro-plan', data),
};

/**
 * COMPANY APIs
 */
export const companyService = {
  getDomains: () =>
    apiClient.get('/domains'),

  getNextCompanyId: () =>
    apiClient.get('/companies/next-id'),

  getCompanies: () =>
    apiClient.get('/companies'),

  addCompany: (payload) =>
    apiClient.post('/companies', payload),

  updateCompany: (id, payload) =>
    apiClient.put(`/companies/${id}`, payload),

  deleteCompany: (id) =>
    apiClient.delete(`/companies/${id}`),

  uploadCompaniesCsv: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', 'csv');

    return apiClient.post('/companies', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

/**
 * DOMAIN JOB ROLE APIs
 */
export const domainService = {
  getNextJobRoleId: () =>
    apiClient.get('/domain-job-roles/next-id'),

  getDomainOptions: () =>
    apiClient.get('/domain-options'),

  getSkillOptions: () =>
    apiClient.get('/domain-job-roles/options/skills'),

  getBranchOptions: () =>
    apiClient.get('/domain-job-roles/options/branches'),

  getDomainJobRoles: () =>
    apiClient.get('/domain-job-roles'),

  addDomainJobRole: (payload) =>
    apiClient.post('/domain-job-roles', payload),

  updateDomainJobRole: (id, payload) =>
    apiClient.put(`/domain-job-roles/${id}`, payload),

  deleteDomainJobRole: (id) =>
    apiClient.delete(`/domain-job-roles/${id}`),
};

export default apiClient;
