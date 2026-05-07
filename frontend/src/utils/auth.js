/**
 * Authentication Utilities
 * Handles JWT token storage and user session management
 */

const TOKEN_KEY = 'access_token';
const USER_ID_KEY = 'user_id';
const USER_ROLE_KEY = 'user_role';
const USER_EMAIL_KEY = 'user_email';
const USER_BRANCH_KEY = 'user_branch';
const PASSWORD_CHANGE_TOKEN_KEY = 'password_change_token';
const PASSWORD_CHANGE_EMAIL_KEY = 'password_change_email';
const PASSWORD_CHANGE_ROLE_KEY = 'password_change_role';

export const authUtils = {
  /**
   * Store authentication tokens and user info
   */
  setAuthData: (token, userId, role, email, branch = null) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_ID_KEY, userId);
    localStorage.setItem(USER_ROLE_KEY, role);
    localStorage.setItem(USER_EMAIL_KEY, email);
    if (branch) {
      localStorage.setItem(USER_BRANCH_KEY, branch);
    }
  },

  /**
   * Get stored authentication token
   */
  getToken: () => localStorage.getItem(TOKEN_KEY),

  /**
   * Get logged-in user ID
   */
  getUserId: () => localStorage.getItem(USER_ID_KEY),

  /**
   * Get user role (Student/TPO)
   */
  getUserRole: () => localStorage.getItem(USER_ROLE_KEY),

  /**
   * Get user email
   */
  getUserEmail: () => localStorage.getItem(USER_EMAIL_KEY),

  /**
   * Get assigned branch (if available)
   */
  getUserBranch: () => localStorage.getItem(USER_BRANCH_KEY),

  /**
   * Get current user object from localStorage
   */
  getUser: () => ({
    id: localStorage.getItem(USER_ID_KEY),
    role: localStorage.getItem(USER_ROLE_KEY),
    email: localStorage.getItem(USER_EMAIL_KEY),
    branch: localStorage.getItem(USER_BRANCH_KEY),
  }),

  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Clear authentication data on logout
   */
  clearAuthData: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    localStorage.removeItem(USER_BRANCH_KEY);
    sessionStorage.removeItem(PASSWORD_CHANGE_TOKEN_KEY);
    sessionStorage.removeItem(PASSWORD_CHANGE_EMAIL_KEY);
    sessionStorage.removeItem(PASSWORD_CHANGE_ROLE_KEY);
  },

  setPasswordChangeData: (token, email = '', role = '') => {
    sessionStorage.setItem(PASSWORD_CHANGE_TOKEN_KEY, token);
    sessionStorage.setItem(PASSWORD_CHANGE_EMAIL_KEY, email);
    sessionStorage.setItem(PASSWORD_CHANGE_ROLE_KEY, role);
  },

  getPasswordChangeToken: () => sessionStorage.getItem(PASSWORD_CHANGE_TOKEN_KEY),

  getPasswordChangeEmail: () => sessionStorage.getItem(PASSWORD_CHANGE_EMAIL_KEY),

  getPasswordChangeRole: () => sessionStorage.getItem(PASSWORD_CHANGE_ROLE_KEY),

  clearPasswordChangeData: () => {
    sessionStorage.removeItem(PASSWORD_CHANGE_TOKEN_KEY);
    sessionStorage.removeItem(PASSWORD_CHANGE_EMAIL_KEY);
    sessionStorage.removeItem(PASSWORD_CHANGE_ROLE_KEY);
  },

  /**
   * Check if user has specific role
   */
  hasRole: (role) => {
    return localStorage.getItem(USER_ROLE_KEY) === role;
  },
};

export default authUtils;
