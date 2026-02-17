/**
 * Authentication Utilities
 * Handles JWT token storage and user session management
 */

const TOKEN_KEY = 'access_token';
const USER_ID_KEY = 'user_id';
const USER_ROLE_KEY = 'user_role';
const USER_EMAIL_KEY = 'user_email';

export const authUtils = {
  /**
   * Store authentication tokens and user info
   */
  setAuthData: (token, userId, role, email) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_ID_KEY, userId);
    localStorage.setItem(USER_ROLE_KEY, role);
    localStorage.setItem(USER_EMAIL_KEY, email);
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
  },

  /**
   * Check if user has specific role
   */
  hasRole: (role) => {
    return localStorage.getItem(USER_ROLE_KEY) === role;
  },
};

export default authUtils;
