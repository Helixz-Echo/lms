/**
 * Application-wide constants
 */

export const APP_CONFIG = {
  NAME: 'Echo LMS',
  DESCRIPTION: 'Learning Management System',
  
  // Assessment settings
  ASSESSMENT: {
    DEFAULT_QUESTIONS: 10,
    MIN_QUESTIONS: 5,
    MAX_QUESTIONS: 20,
  },
  
  // File upload settings
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['.csv'],
    MIME_TYPES: ['text/csv'],
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
} as const;

export const MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;
