// Centralized query key factory — prevents typo bugs and enables precise invalidation

export const queryKeys = {
  // Leads
  leads:       ['leads'] as const,
  lead:        (id: string) => ['leads', id] as const,
  leadNotes:   (leadId: string) => ['leads', leadId, 'notes'] as const,

  // Projects
  projects:    ['projects'] as const,
  project:     (id: string) => ['projects', id] as const,
  projectTasks:(id: string) => ['projects', id, 'tasks'] as const,

  // Tasks
  tasks:       ['tasks'] as const,
  task:        (id: string) => ['tasks', id] as const,

  // Blog
  blogPosts:   ['blog'] as const,
  blogPost:    (id: string) => ['blog', id] as const,

  // Notifications
  notifications: ['notifications'] as const,
  notificationCount: ['notifications', 'count'] as const,

  // Team
  team:        ['team'] as const,

  // Content calendar
  calendar:    ['calendar'] as const,

  // Docs
  docs:        ['docs'] as const,
  doc:         (id: string) => ['docs', id] as const,
} as const
