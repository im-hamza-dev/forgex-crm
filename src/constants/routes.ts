export const ROUTES = {
  // Auth
  LOGIN:            '/login',
  SIGNUP:           '/signup',
  FORGOT_PASSWORD:  '/forgot-password',
  RESET_PASSWORD:   '/reset-password',
  AUTH_CALLBACK:    '/api/auth/callback',

  // Dashboard
  DASHBOARD:        '/dashboard',

  // CRM
  LEADS:            '/leads',
  LEAD:             (id: string) => `/leads/${id}`,

  // Projects
  PROJECTS:         '/projects',
  PROJECT:          (id: string) => `/projects/${id}`,

  // Tasks
  TASKS:            '/tasks',

  // Blog
  BLOG:             '/blog',
  BLOG_POST:        (id: string) => `/blog/${id}`,
  BLOG_NEW:         '/blog/new',

  // Content
  CONTENT_CALENDAR: '/content-calendar',
  DOCS:             '/docs',
  DOC:              (id: string) => `/docs/${id}`,
  DOC_NEW:          '/docs/new',

  // Team & Settings
  TEAM:             '/team',
  SETTINGS:         '/settings',

  // Reports
  REPORTS:          '/reports',

  // Notifications
  NOTIFICATIONS:    '/notifications',

  // Client Portal
  PORTAL_PROJECT:   (projectId: string) => `/portal/${projectId}`,
  PORTAL_TICKETS:   (projectId: string) => `/portal/${projectId}/tickets`,
  PORTAL_FILES:     (projectId: string) => `/portal/${projectId}/files`,
  PORTAL_ACCEPT:    '/portal/accept',

  // API
  API: {
    LEADS:          '/api/leads',
    LEAD:           (id: string) => `/api/leads/${id}`,
    PROJECTS:       '/api/projects',
    PROJECT:        (id: string) => `/api/projects/${id}`,
    TASKS:          '/api/tasks',
    TASK:           (id: string) => `/api/tasks/${id}`,
    BLOG:           '/api/blog',
    BLOG_POST:      (id: string) => `/api/blog/${id}`,
    NOTIFICATIONS:  '/api/notifications',
    TEAM:           '/api/team',
    TICKETS:        '/api/tickets',
    DOCS:           '/api/docs',
  },
} as const
