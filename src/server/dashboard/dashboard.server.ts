'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { requireSession } from '@/server/shared/require-session'
import type { TeamRole } from '@/constants/roles'

const EMPTY_ID = '00000000-0000-0000-0000-000000000000'

// ─── Types ───────────────────────────────────────────────────

export interface DashboardKpis {
  activeLeads: number
  activeLeadsSub: string
  activeProjects: number
  activeProjectsSub: string
  tasksDueToday: number
  tasksDueTodaySub: string
  followUpsDue: number
  followUpsSub: string
}

export interface DashboardLead {
  id: string
  name: string
  company: string | null
  stage: string
  date: string
}

export interface DashboardActivity {
  text: string
  time: string
}

export interface DashboardTask {
  id: string
  title: string
  project: string
  priority: 'Urgent' | 'High' | 'Medium' | 'Low'
  assigneeName: string
  assigneeAvatar: string | null
  due: string
  overdue: boolean
}

export interface DashboardData {
  kpis: DashboardKpis
  recentLeads: DashboardLead[]
  activity: DashboardActivity[]
  tasksDueToday: DashboardTask[]
  role: TeamRole
  pendingBlogReviews: number
  openTickets: number
}

type ActivityRow = {
  action: string
  actor_name: string
  created_at: string
  lead_id: string
}

type ProfileEmbed = { full_name: string | null; avatar_url: string | null } | null
type ProjectEmbed = { name: string } | null

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

// ─── Helpers ─────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  )
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0] ?? dateStr
}

function capitalizeStage(stage: string): string {
  const map: Record<string, string> = {
    new_lead: 'New Lead',
    contacted: 'Contacted',
    qualified: 'Qualified',
    proposal_sent: 'Proposal Sent',
    negotiation: 'Negotiation',
    won: 'Won',
    lost: 'Lost',
  }
  return map[stage] ?? stage
}

function capitalizePriority(p: string): 'Urgent' | 'High' | 'Medium' | 'Low' {
  const map: Record<string, 'Urgent' | 'High' | 'Medium' | 'Low'> = {
    urgent: 'Urgent',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }
  return map[p] ?? 'Medium'
}

function formatActivityText(action: string, actorName: string): string {
  const phrases: Record<string, string> = {
    lead_created: 'created a lead',
    stage_changed: 'changed a lead stage',
    note_added: 'added a note',
    note_deleted: 'deleted a note',
    attachment_added: 'added an attachment',
    attachment_deleted: 'deleted an attachment',
    lead_assigned: 'assigned a lead',
    lead_updated: 'updated a lead',
    lead_deleted: 'deleted a lead',
  }
  const phrase = phrases[action] ?? action
  return `${actorName} ${phrase}`
}

// ─── Main data loader ─────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData> {
  const { user } = await requireSession()
  const service = createServiceClient()
  const today = new Date().toISOString().split('T')[0]!
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]!

  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'member') as TeamRole
  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const isMember = role === 'member'

  // ─── KPIs ────────────────────────────────────────────────

  let leadsQuery = service
    .from('leads')
    .select('id, created_at', { count: 'exact' })
    .eq('status', 'active')

  if (isMember) leadsQuery = leadsQuery.eq('assigned_to', user.id)

  const { count: activeLeads } = await leadsQuery

  let leadsWeekQuery = service
    .from('leads')
    .select('id', { count: 'exact' })
    .eq('status', 'active')
    .gte('created_at', weekAgo)

  if (isMember) leadsWeekQuery = leadsWeekQuery.eq('assigned_to', user.id)

  const { count: leadsThisWeek } = await leadsWeekQuery

  let projectsQuery = service
    .from('projects')
    .select('id, status', { count: 'exact' })
    .not('status', 'in', '(delivered,cancelled)')

  if (isManager) {
    const { data: memberOf } = await service
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)
    const ids = (memberOf ?? []).map((m) => m.project_id)
    projectsQuery = projectsQuery.in('id', ids.length > 0 ? ids : [EMPTY_ID])
  }

  if (isMember) {
    projectsQuery = projectsQuery.eq('id', EMPTY_ID)
  }

  const { data: projectsData, count: activeProjects } = await projectsQuery
  const onTrack = (projectsData ?? []).filter(
    (p) => p.status === 'in_progress',
  ).length

  let tasksKpiQuery = service
    .from('tasks')
    .select('id, due_date', { count: 'exact' })
    .neq('status', 'done')
    .lte('due_date', today)

  if (!isAdmin) tasksKpiQuery = tasksKpiQuery.eq('assigned_to', user.id)

  const { data: tasksDueData, count: tasksDueToday } = await tasksKpiQuery
  const overdueCount = (tasksDueData ?? []).filter(
    (t) => (t.due_date ?? '') < today,
  ).length

  let followUpsQuery = service
    .from('leads')
    .select('id', { count: 'exact' })
    .eq('status', 'active')
    .eq('next_follow_up', today)

  if (!isAdmin) followUpsQuery = followUpsQuery.eq('assigned_to', user.id)

  const { count: followUpsDue } = await followUpsQuery

  // ─── Recent Leads ─────────────────────────────────────────

  let recentLeadsQuery = service
    .from('leads')
    .select('id, contact_name, company, stage, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (isMember) recentLeadsQuery = recentLeadsQuery.eq('assigned_to', user.id)

  const { data: leadsData } = await recentLeadsQuery

  const recentLeads: DashboardLead[] = (leadsData ?? []).map((l) => ({
    id: l.id,
    name: l.contact_name,
    company: l.company,
    stage: capitalizeStage(l.stage),
    date: formatDate(l.created_at),
  }))

  // ─── Recent Activity ──────────────────────────────────────

  let activityQuery = service
    .from('lead_activity' as never)
    .select('action, actor_name, created_at, lead_id')
    .order('created_at', { ascending: false })
    .limit(10)

  if (isMember) {
    const { data: myLeads } = await service
      .from('leads')
      .select('id')
      .eq('assigned_to', user.id)
    const myLeadIds = (myLeads ?? []).map((l) => l.id)
    activityQuery = activityQuery.in(
      'lead_id',
      myLeadIds.length > 0 ? myLeadIds : [EMPTY_ID],
    )
  }

  const { data: activityData } = await activityQuery

  const activity: DashboardActivity[] = ((activityData ?? []) as ActivityRow[]).map(
    (a) => ({
      text: formatActivityText(a.action, a.actor_name),
      time: timeAgo(a.created_at),
    }),
  )

  // ─── Tasks Due Today (list) ───────────────────────────────

  let taskListQuery = service
    .from('tasks')
    .select(
      `
      id, title, priority, due_date,
      project:projects(name),
      assignee:profiles!tasks_assigned_to_fkey(full_name, avatar_url)
    `,
    )
    .neq('status', 'done')
    .lte('due_date', today)
    .order('due_date', { ascending: true })
    .limit(10)

  if (!isAdmin) taskListQuery = taskListQuery.eq('assigned_to', user.id)

  const { data: taskListData } = await taskListQuery

  const tasksDueTodayList: DashboardTask[] = (taskListData ?? []).map((t) => {
    const assignee = asOne(t.assignee as ProfileEmbed | ProfileEmbed[])
    const project = asOne(t.project as ProjectEmbed | ProjectEmbed[])
    return {
      id: t.id,
      title: t.title,
      project: project?.name ?? 'No Project',
      priority: capitalizePriority(t.priority),
      assigneeName: assignee?.full_name ?? 'Unassigned',
      assigneeAvatar: assignee?.avatar_url ?? null,
      due: t.due_date ?? '',
      overdue: (t.due_date ?? '') < today,
    }
  })

  // ─── Blog reviews + open tickets (admin + manager) ────────

  let pendingBlogReviews = 0
  let openTickets = 0

  if (isAdmin || isManager) {
    const { count: blogCount } = await service
      .from('blog_posts')
      .select('id', { count: 'exact' })
      .eq('status', 'in_review')

    pendingBlogReviews = blogCount ?? 0

    const { count: ticketCount } = await service
      .from('client_tickets')
      .select('id', { count: 'exact' })
      .eq('status', 'open')

    openTickets = ticketCount ?? 0
  }

  const kpis: DashboardKpis = {
    activeLeads: activeLeads ?? 0,
    activeLeadsSub: isMember
      ? `${leadsThisWeek ?? 0} assigned this week`
      : `↑ ${leadsThisWeek ?? 0} this week`,
    activeProjects: isMember ? 0 : (activeProjects ?? 0),
    activeProjectsSub: isMember
      ? 'No project access'
      : `${onTrack} in progress`,
    tasksDueToday: tasksDueToday ?? 0,
    tasksDueTodaySub:
      overdueCount > 0 ? `${overdueCount} overdue` : 'All on time',
    followUpsDue: followUpsDue ?? 0,
    followUpsSub: 'Due today',
  }

  return {
    kpis,
    recentLeads,
    activity,
    tasksDueToday: tasksDueTodayList,
    role,
    pendingBlogReviews,
    openTickets,
  }
}
