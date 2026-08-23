// Centralized query key factory — prevents typo bugs and enables precise invalidation

export const queryKeys = {
  // Leads
  leads: {
    all: ['leads'] as const,
    list: (filters?: Record<string, string | undefined>) =>
      ['leads', 'list', filters ?? {}] as const,
    detail: (id: string) => ['leads', 'detail', id] as const,
    notes: (id: string) => ['leads', id, 'notes'] as const,
    attachments: (id: string) => ['leads', id, 'attachments'] as const,
    activity: (id: string) => ['leads', id, 'activity'] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    list: () => ['projects', 'list'] as const,
    detail: (id: string) => ['projects', 'detail', id] as const,
    milestones: (id: string) => ['projects', id, 'milestones'] as const,
    updates: (id: string) => ['projects', id, 'updates'] as const,
    files: (id: string) => ['projects', id, 'files'] as const,
    tickets: (id: string) => ['projects', id, 'tickets'] as const,
    tasks: (id: string) => ['projects', id, 'tasks'] as const,
    ticketMessages: (ticketId: string) =>
      ['projects', 'tickets', ticketId, 'messages'] as const,
  },

  // Tasks
  tasks: {
    all: ['tasks'] as const,
    list: (filters: Record<string, unknown> = {}) =>
      ['tasks', 'list', filters] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
    comments: (id: string) => ['tasks', id, 'comments'] as const,
    byProject: (projectId: string) =>
      ['tasks', 'project', projectId] as const,
  },
  task: (id: string) => ['tasks', 'detail', id] as const,

  // Videos
  videos: {
    all: ['videos'] as const,
    list: (filters?: Record<string, string | undefined>) =>
      ['videos', 'list', filters ?? {}] as const,
    detail: (id: string) => ['videos', 'detail', id] as const,
  },

  // Blog
  blog: {
    all: ['blog'] as const,
    list: (filters: Record<string, unknown> = {}) =>
      ['blog', 'list', filters] as const,
    detail: (id: string) => ['blog', 'detail', id] as const,
    comments: (id: string) => ['blog', id, 'comments'] as const,
    categories: ['blog', 'categories'] as const,
  },
  blogPosts: ['blog'] as const,
  blogPost: (id: string) => ['blog', 'detail', id] as const,

  // Notifications
  notifications: ['notifications'] as const,
  notificationCount: ['notifications', 'count'] as const,

  // Team
  team: ['team'] as const,

  // Content calendar
  calendar: {
    all: ['calendar'] as const,
    entries: (year: number, month: number) =>
      ['calendar', 'entries', year, month] as const,
  },

  // Docs
  docs: {
    all: ['docs'] as const,
    internalList: (filters: Record<string, unknown>) =>
      ['docs', 'internal', 'list', filters] as const,
    internalDetail: (id: string) =>
      ['docs', 'internal', 'detail', id] as const,
    clientList: () => ['docs', 'client', 'list'] as const,
    clientDetail: (id: string) => ['docs', 'client', 'detail', id] as const,
    clientAccounts: () => ['docs', 'client-accounts'] as const,
  },
  doc: (id: string) => ['docs', 'internal', 'detail', id] as const,
} as const
