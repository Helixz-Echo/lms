/**
 * Application route constants
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/auth/login',
  
  // Dashboard routes
  DASHBOARD: {
    ADMIN: '/dashboard/admin',
    TRAINER: '/dashboard/trainer',
    UPLOAD: '/dashboard/admin/upload',
    DOCUMENTS: '/dashboard/admin/documents',
    SESSIONS: '/dashboard/admin/sessions',
    TRAINING_DOCUMENTS: '/dashboard/admin/training-documents',
  },
  
  // Chat routes
  CHAT: '/chat',
} as const;

export const API_ROUTES = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/login',
    LOGOUT: '/api/logout',
  },
  
  // Assessment endpoints
  ASSESSMENT: '/api/assessment',
  
  // Document endpoints
  DOCUMENTS: '/api/documents',
  
  // Training endpoints
  TRAINING: {
    UPLOAD: '/api/training/upload',
    DOCUMENTS: '/api/training/documents',
    SESSIONS: '/api/training/sessions',
    CLEAR: '/api/training/clear',
  },
  
  // Chat endpoints
  CHAT: '/api/chat',
  
  // Upload endpoints
  UPLOAD: '/api/upload',
} as const;
