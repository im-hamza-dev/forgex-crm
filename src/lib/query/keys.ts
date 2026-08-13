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
  tasks: ['tasks'] as const,
  task: (id: string) => ['tasks', id] as const,

  // Blog
  blogPosts: ['blog'] as const,
  blogPost: (id: string) => ['blog', id] as const,

  // Notifications
  notifications: ['notifications'] as const,
  notificationCount: ['notifications', 'count'] as const,

  // Team
  team: ['team'] as const,

  // Content calendar
  calendar: ['calendar'] as const,

  // Docs
  docs: ['docs'] as const,
  doc: (id: string) => ['docs', id] as const,
} as const
