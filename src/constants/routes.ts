export const ROUTES = {
  // Auth
  LOGIN:            '/login',
  SETUP:            '/setup',
  ACCEPT_INVITE:    '/accept-invite',
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

  // Videos
  VIDEOS:           '/videos',
  /** Public share page. Slug is frozen at creation so old links keep working. */
  VIDEO_PUBLIC:     (slug: string) => `/v/${slug}`,

  // Content
  CONTENT_CALENDAR: '/content-calendar',
  DOCS:             '/docs',
  DOC:              (id: string) => `/docs/${id}`,
  DOC_NEW:          '/docs/new',
  DOC_CLIENT:       (id: string) => `/docs/client/${id}`,
  DOC_CLIENT_NEW:   '/docs/client/new',

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
    VIDEOS:         '/api/videos',
    VIDEO:          (id: string) => `/api/videos/${id}`,
    VIDEO_RESTORE:  (id: string) => `/api/videos/${id}/restore`,
    VIDEO_PLAYBACK_URL: (id: string) => `/api/videos/${id}/playback-url`,
    VIDEO_EVENTS: (id: string) => `/api/videos/${id}/events`,
    VIDEO_PUBLIC_EVENTS: (slug: string) => `/api/videos/public/${slug}/events`,
    VIDEO_UPLOAD_URL: '/api/videos/upload-url',
    BLOG:           '/api/blog',
    BLOG_POST:      (id: string) => `/api/blog/${id}`,
    NOTIFICATIONS:  '/api/notifications',
    TEAM:           '/api/team',
    TEAM_INVITE:    '/api/team/invite',
    TICKETS:        '/api/tickets',
    DOCS:           '/api/docs',
  },
} as const
