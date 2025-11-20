/**
 * API Configuration
 * Manages API URLs for different environments
 */

// Determine if we're in development mode
const isDevelopment = __DEV__;

// API Base URLs - hardcoded for reliability
export const API_BASE_URL = isDevelopment
  ? 'http://192.168.12.196:3000' // Local development
  : 'http://3.237.38.24:3000'; // Production EC2 server

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    register: `${API_BASE_URL}/api/v1/auth/register`,
    login: `${API_BASE_URL}/api/v1/auth/login`,
    logout: `${API_BASE_URL}/api/v1/auth/logout`,
    me: `${API_BASE_URL}/api/v1/auth/me`,
    refreshToken: `${API_BASE_URL}/api/v1/auth/refresh`,
  },

  // Password Management
  password: {
    change: `${API_BASE_URL}/api/v1/password/change-password`,
    forgot: `${API_BASE_URL}/api/v1/password/forgot-password`,
    reset: `${API_BASE_URL}/api/v1/password/reset-password`,
  },

  // Ingredients
  ingredients: {
    base: `${API_BASE_URL}/api/v1/ingredients`,
    byId: (id: number) => `${API_BASE_URL}/api/v1/ingredients/${id}`,
  },

  // Recipes
  recipes: {
    base: `${API_BASE_URL}/api/v1/recipes`,
    search: `${API_BASE_URL}/api/v1/recipes/search`,
    byId: (id: string) => `${API_BASE_URL}/api/v1/recipes/${id}`,
    saved: `${API_BASE_URL}/api/v1/recipes/saved`,
  },

  // User Recipes
  userRecipes: {
    base: `${API_BASE_URL}/api/v1/recipes/user`,
    byId: (id: number) => `${API_BASE_URL}/api/v1/recipes/user/${id}`,
    public: `${API_BASE_URL}/api/v1/recipes/user/public/all`,
    favorite: (id: number) =>
      `${API_BASE_URL}/api/v1/recipes/user/${id}/favorite`,
  },

  // Barcode
  barcode: {
    scan: `${API_BASE_URL}/api/v1/barcode/scan`,
    lookup: (barcode: string) => `${API_BASE_URL}/api/v1/barcode/${barcode}`,
  },

  // Feedback
  feedback: {
    submit: `${API_BASE_URL}/api/v1/feedback`,
  },

  // Dietary Preferences
  dietary: {
    base: `${API_BASE_URL}/api/v1/dietary`,
  },

  // Shopping List
  shopping: {
    base: `${API_BASE_URL}/api/v1/shopping-list`,
  },

  // Points & Rewards
  points: {
    base: `${API_BASE_URL}/api/v1/points`,
    history: `${API_BASE_URL}/api/v1/points/history`,
  },

  // Referrals
  referrals: {
    base: `${API_BASE_URL}/api/v1/referrals`,
    stats: `${API_BASE_URL}/api/v1/referrals/stats`,
    accessInfo: `${API_BASE_URL}/api/v1/referrals/access-info`,
    validate: `${API_BASE_URL}/api/v1/referrals/validate`,
  },

  // Payments
  payments: {
    base: `${API_BASE_URL}/api/v1/payments`,
    subscribe: `${API_BASE_URL}/api/v1/payments/subscribe`,
  },

  // Health Check
  health: `${API_BASE_URL}/health`,
};

// API Configuration
export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper function to get auth header
export const getAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  API_CONFIG,
  getAuthHeader,
};
