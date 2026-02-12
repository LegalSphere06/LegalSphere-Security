/**
 * Centralized Axios Instance with Security Interceptors
 * 
 * Provides a pre-configured axios instance with:
 * - JWT Bearer token authentication via request interceptor
 * - Automatic token expiry handling via response interceptor
 * - Client-side request rate limiting
 * - Response data sanitization
 * 
 * Policy Reference: Risk R2 – API Abuse & Unauthorized Access
 */

import axios from 'axios';
import { sanitizeObject } from './sanitize';

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 1000; // 1 second window
const RATE_LIMIT_MAX_REQUESTS = 10; // Max requests per window
const requestLog = [];

/**
 * Simple client-side rate limiter.
 * Rejects requests that exceed the configured rate limit.
 * 
 * @returns {boolean} true if the request is allowed
 */
const isRateLimited = () => {
  const now = Date.now();
  // Remove old entries outside the window
  while (requestLog.length > 0 && requestLog[0] < now - RATE_LIMIT_WINDOW_MS) {
    requestLog.shift();
  }
  if (requestLog.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true; // Rate limited
  }
  requestLog.push(now);
  return false;
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  timeout: 30000, // 30 second timeout to prevent hanging requests
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * - Attaches JWT Bearer token from localStorage
 * - Enforces client-side rate limiting
 */
api.interceptors.request.use(
  (config) => {
    // Rate limiting check
    if (isRateLimited()) {
      return Promise.reject(new Error('Too many requests. Please slow down and try again.'));
    }

    // Attach JWT token as Bearer authorization
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      // Also keep the legacy 'token' header for backward compatibility
      // until the backend is updated to read Authorization header
      config.headers['token'] = token;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * - Handles 401/403 by clearing token and redirecting to login
 * - Sanitizes response data to prevent stored XSS from API responses
 */
api.interceptors.response.use(
  (response) => {
    // Sanitize response data to prevent stored XSS
    if (response.data && typeof response.data === 'object') {
      response.data = sanitizeObject(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // Handle unauthorized/forbidden responses
      if (status === 401 || status === 403) {
        // Clear stale token
        localStorage.removeItem('token');
        
        // Redirect to login page (only if not already there)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
