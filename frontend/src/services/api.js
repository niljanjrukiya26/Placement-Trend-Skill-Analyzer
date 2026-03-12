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
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * AUTHENTICATION APIs
 */
export const authService = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  
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
};

/**
 * TPO APIs
 */
export const tpoService = {
  getProfile: () =>
    apiClient.get('/tpo/profile'),
  
  getBranchStudents: () =>
    apiClient.get('/tpo/students'),
  
  getPlacementRecords: (year = null) => {
    const params = year ? { year } : {};
    return apiClient.get('/tpo/placement-records', { params });
  },
  
  getBranchStatistics: () =>
    apiClient.get('/tpo/branch-statistics'),
};

export default apiClient;
