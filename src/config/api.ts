/**
 * API Configuration
 * Manages API URLs for different environments
 */

// Determine if we're in development mode
const isDevelopment = __DEV__;

// API Base URLs
export const API_BASE_URL = isDevelopment
  ? 'http://192.168.12.196:3000' // Local development
  : 'https://your-production-api.awsapprunner.com'; // Production AWS App Runner URL

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
    code: `${API_BASE_URL}/api/v1/referrals/code`,
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
