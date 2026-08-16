'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { requireRole } from '@/server/shared/require-session'

// ─── Types ───────────────────────────────────────────────────

export interface PipelineStage {
  label: string
  count: number
  color: string
}

export interface PipelineKpis {
  avgDaysToClose: number
  winRate: string
  totalPipeline: string
}

export interface LeadSource {
  name: string
  value: number
  pct: string
  color: string
}

export interface RevenueData {
  wonAmount: number
  lostAmount: number
  wonPct: number
  changeVsLastMonth: string
  changeVariant: 'success' | 'danger' | 'muted'
}

export interface ActiveProject {
  id: string
  name: string
  status: string
  pct: number
  deadline: string | null
  daysLeft: number | null
  team: { name: string; avatar: string | null }[]
}

export interface TeamStat {
  id: string
  name: string
  avatar: string | null
  tasksCompleted: number
  totalTasks: number
  leadsCount: number
}

export interface ReportsData {
  pipelineStages: PipelineStage[]
  pipelineKpis: PipelineKpis
  leadSources: LeadSource[]
  revenue: RevenueData
  activeProjects: ActiveProject[]
  teamStats: TeamStat[]
  dateRange: string
}

type ProfileEmbed = { full_name: string | null; avatar_url: string | null } | null

type ProjectMemberEmbed = {
  user_id: string
  profiles: ProfileEmbed | ProfileEmbed[]
}

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

// ─── Color maps ───────────────────────────────────────────────

const STAGE_COLORS: Record<string, string> = {
  new_lead: '#9CA3AF',
  contacted: '#1A3D6B',
  qualified: '#4A1D6B',
  proposal_sent: '#8B5E00',
  negotiation: '#7A2D5C',
  won: '#2D6A2D',
  lost: '#8B1A1A',
}

const STAGE_LABELS: Record<string, string> = {
  new_lead: 'New Lead',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
}

const SOURCE_COLORS: Record<string, string> = {
  referral: '#9c6644',
  website_form: '#1A3D6B',
  cold_outreach: '#4A1D6B',
  social: '#2D6A2D',
  other: '#9CA3AF',
}

const SOURCE_LABELS: Record<string, string> = {
  referral: 'Referral',
  website_form: 'Website form',
  cold_outreach: 'Cold outreach',
  social: 'Social media',
  other: 'Other',
}

function parseBudget(range: string | null): number {
  if (!range) return 0
  const match = range.replace(/,/g, '').match(/\d+(\.\d+)?/)
  return match ? Number(match[0]) : 0
}

// ─── Date range helper ────────────────────────────────────────

function getDateRange(range: string): { from: string; prevFrom: string; prevTo: string } {
  const now = new Date()
  let days = 30

  if (range === 'Last 7 days') days = 7
  else if (range === 'Last 30 days') days = 30
  else if (range === 'Last 90 days') days = 90
  else if (range === 'This month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const prevTo = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()
    return { from, prevFrom, prevTo }
  } else if (range === 'Last month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const prevFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString()
    const prevTo = new Date(now.getFullYear(), now.getMonth() - 1, 0).toISOString()
    return { from, prevFrom, prevTo }
  } else if (range === 'This quarter') days = 90

  const from = new Date(now.getTime() - days * 86400000).toISOString()
  const prevFrom = new Date(now.getTime() - days * 2 * 86400000).toISOString()
  const prevTo = from
  return { from, prevFrom, prevTo }
}

// ─── Main loader ──────────────────────────────────────────────

export async function getReportsData(dateRange = 'Last 30 days'): Promise<ReportsData> {
  await requireRole(['admin'])
  const service = createServiceClient()
  const { from, prevFrom, prevTo } = getDateRange(dateRange)

  // ─── Pipeline stages ──────────────────────────────────────
  const { data: stageData } = await service
    .from('leads')
    .select('stage, budget_range')
    .gte('created_at', from)

  const stageCounts: Record<string, number> = {}
  for (const row of stageData ?? []) {
    stageCounts[row.stage] = (stageCounts[row.stage] ?? 0) + 1
  }

  const pipelineStages: PipelineStage[] = Object.entries(STAGE_LABELS).map(
    ([key, label]) => ({
      label,
      count: stageCounts[key] ?? 0,
      color: STAGE_COLORS[key] ?? '#9CA3AF',
    }),
  )

  // ─── Pipeline KPIs ────────────────────────────────────────
  const { data: wonLeads } = await service
    .from('leads')
    .select('created_at, updated_at, budget_range')
    .eq('stage', 'won')
    .gte('updated_at', from)

  const { data: lostLeads } = await service
    .from('leads')
    .select('id')
    .eq('stage', 'lost')
    .gte('updated_at', from)

  const wonCount = wonLeads?.length ?? 0
  const lostCount = lostLeads?.length ?? 0
  const totalClosed = wonCount + lostCount
  const winRate =
    totalClosed > 0 ? `${Math.round((wonCount / totalClosed) * 100)}%` : '0%'

  const avgDaysToClose =
    wonLeads && wonLeads.length > 0
      ? Math.round(
          wonLeads.reduce((sum, l) => {
            const diff =
              new Date(l.updated_at).getTime() - new Date(l.created_at).getTime()
            return sum + diff / 86400000
          }, 0) / wonLeads.length,
        )
      : 0

  const openLeads = (stageData ?? []).filter(
    (l) => l.stage !== 'won' && l.stage !== 'lost',
  )
  const totalPipelineValue = openLeads.reduce(
    (sum, l) => sum + parseBudget(l.budget_range),
    0,
  )

  const pipelineKpis: PipelineKpis = {
    avgDaysToClose,
    winRate,
    totalPipeline:
      totalPipelineValue > 0
        ? `$${Math.round(totalPipelineValue / 1000)}k`
        : `${openLeads.length} active`,
  }

  // ─── Lead sources ─────────────────────────────────────────
  const { data: sourceData } = await service
    .from('leads')
    .select('source')
    .gte('created_at', from)

  const sourceCounts: Record<string, number> = {}
  for (const row of sourceData ?? []) {
    sourceCounts[row.source] = (sourceCounts[row.source] ?? 0) + 1
  }

  const totalSources = Object.values(sourceCounts).reduce((a, b) => a + b, 0)

  const leadSources: LeadSource[] = Object.entries(sourceCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([key, value]) => ({
      name: SOURCE_LABELS[key] ?? key,
      value,
      pct:
        totalSources > 0 ? `${Math.round((value / totalSources) * 100)}%` : '0%',
      color: SOURCE_COLORS[key] ?? '#9CA3AF',
    }))

  // ─── Revenue ──────────────────────────────────────────────
  const { data: wonProjects } = await service
    .from('projects')
    .select('fixed_price, currency')
    .not('fixed_price', 'is', null)
    .gte('created_at', from)

  const { data: prevWonProjects } = await service
    .from('projects')
    .select('fixed_price')
    .not('fixed_price', 'is', null)
    .gte('created_at', prevFrom)
    .lte('created_at', prevTo)

  const wonAmount = (wonProjects ?? []).reduce(
    (sum, p) => sum + (p.fixed_price ?? 0),
    0,
  )
  const prevWonAmount = (prevWonProjects ?? []).reduce(
    (sum, p) => sum + (p.fixed_price ?? 0),
    0,
  )

  const lostAmount = lostCount * 5000

  const wonPct =
    wonAmount + lostAmount > 0
      ? Math.round((wonAmount / (wonAmount + lostAmount)) * 100)
      : 100

  let changeVsLastMonth = 'No previous data'
  let changeVariant: 'success' | 'danger' | 'muted' = 'muted'

  if (prevWonAmount > 0) {
    const changePct = Math.round(
      ((wonAmount - prevWonAmount) / prevWonAmount) * 100,
    )
    changeVsLastMonth = `${changePct >= 0 ? '↑' : '↓'} ${Math.abs(changePct)}% vs previous period`
    changeVariant = changePct >= 0 ? 'success' : 'danger'
  } else if (wonAmount > 0) {
    changeVsLastMonth = 'New revenue this period'
    changeVariant = 'success'
  }

  const revenue: RevenueData = {
    wonAmount,
    lostAmount,
    wonPct,
    changeVsLastMonth,
    changeVariant,
  }

  // ─── Active projects ──────────────────────────────────────
  const { data: projectsData } = await service
    .from('projects')
    .select(
      `
      id, name, status, completion_pct, deadline,
      project_members(
        user_id,
        profiles!project_members_user_id_fkey(full_name, avatar_url)
      )
    `,
    )
    .not('status', 'in', '(delivered,cancelled)')
    .order('created_at', { ascending: false })
    .limit(8)

  const activeProjects: ActiveProject[] = (projectsData ?? []).map((p) => {
    const daysLeft = p.deadline
      ? Math.ceil((new Date(p.deadline).getTime() - Date.now()) / 86400000)
      : null

    const members = (p.project_members ?? []) as unknown as ProjectMemberEmbed[]
    const team = members
      .map((m) => {
        const profile = asOne(m.profiles)
        return {
          name: profile?.full_name ?? 'Unknown',
          avatar: profile?.avatar_url ?? null,
        }
      })
      .slice(0, 3)

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      pct: p.completion_pct ?? 0,
      deadline: p.deadline,
      daysLeft,
      team,
    }
  })

  // ─── Team activity ────────────────────────────────────────
  const { data: profiles } = await service
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('is_active', true)

  const memberIds = (profiles ?? []).map((p) => p.id)

  const completedMap: Record<string, number> = {}
  const totalMap: Record<string, number> = {}
  const leadsMap: Record<string, number> = {}

  if (memberIds.length > 0) {
    const { data: completedTasks } = await service
      .from('tasks')
      .select('assigned_to')
      .eq('status', 'done')
      .gte('updated_at', from)
      .in('assigned_to', memberIds)

    const { data: totalTasks } = await service
      .from('tasks')
      .select('assigned_to')
      .in('assigned_to', memberIds)

    const { data: leadsPerMember } = await service
      .from('leads')
      .select('assigned_to')
      .eq('status', 'active')
      .in('assigned_to', memberIds)

    for (const t of completedTasks ?? []) {
      if (t.assigned_to) {
        completedMap[t.assigned_to] = (completedMap[t.assigned_to] ?? 0) + 1
      }
    }

    for (const t of totalTasks ?? []) {
      if (t.assigned_to) {
        totalMap[t.assigned_to] = (totalMap[t.assigned_to] ?? 0) + 1
      }
    }

    for (const l of leadsPerMember ?? []) {
      if (l.assigned_to) {
        leadsMap[l.assigned_to] = (leadsMap[l.assigned_to] ?? 0) + 1
      }
    }
  }

  const teamStats: TeamStat[] = (profiles ?? [])
    .map((p) => ({
      id: p.id,
      name: p.full_name ?? 'Unknown',
      avatar: p.avatar_url,
      tasksCompleted: completedMap[p.id] ?? 0,
      totalTasks: totalMap[p.id] ?? 0,
      leadsCount: leadsMap[p.id] ?? 0,
    }))
    .sort((a, b) => b.tasksCompleted - a.tasksCompleted)

  return {
    pipelineStages,
    pipelineKpis,
    leadSources,
    revenue,
    activeProjects,
    teamStats,
    dateRange,
  }
}
