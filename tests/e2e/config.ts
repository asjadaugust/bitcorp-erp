/**
 * Global E2E Test Configuration
 * Centralized configuration for all Playwright tests
 */

export const TEST_CONFIG = {
  // Base URLs
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3420',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3410',

  // API Endpoints
  API_BASE: process.env.API_BASE || 'http://localhost:3410/api',

  // Test Users
  ADMIN_USER: {
    username: 'admin',
    password: 'admin123',
    email: 'admin@bitcorp.local',
  },

  OPERATOR_USER: {
    username: 'operator',
    password: 'operator123',
    email: 'operator@bitcorp.local',
  },

  // Timeouts
  TIMEOUT: {
    NAVIGATION: 30000,
    API_CALL: 10000,
    ELEMENT: 5000,
  },
};

// Helper functions
export const getUrl = (path: string = ''): string => {
  return `${TEST_CONFIG.FRONTEND_URL}${path}`;
};

export const getApiUrl = (endpoint: string): string => {
  return `${TEST_CONFIG.API_BASE}${endpoint}`;
};
