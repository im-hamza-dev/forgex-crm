import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/constants/routes'
import { DashboardShell } from '@/components/layout'
import {
  KpiCard,
  RecentLeads,
  ActivityFeed,
  TasksDueToday,
} from '@/components/dashboard'
import { getDashboardData } from '@/server/dashboard/dashboard.server'

export const metadata = { title: 'Dashboard' }

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(ROUTES.LOGIN)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const role = profile?.role ?? 'member'
  const isAdmin = role === 'admin'
  const isManager = role === 'manager'

  const data = await getDashboardData()

  return (
    <DashboardShell title="Dashboard">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-[28px] font-bold leading-tight text-[var(--color-text-heading)]">
          {getGreeting()}, {firstName}
        </h2>
        <span className="text-[13px] text-[var(--color-text-muted)]">
          {getFormattedDate()}
        </span>
      </div>

      {(isAdmin || isManager) && (
        <div className="flex flex-col gap-2 mb-4">
          {data.pendingBlogReviews > 0 && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium"
              style={{
                background: 'var(--color-warning-bg)',
                borderColor: 'var(--color-warning)',
                color: 'var(--color-warning)',
              }}
            >
              <AlertCircle size={15} />
              {data.pendingBlogReviews} blog post
              {data.pendingBlogReviews !== 1 ? 's' : ''} pending review
              <Link
                href={ROUTES.BLOG}
                className="ml-auto text-[12px] underline hover:opacity-70 transition-opacity"
              >
                Review now →
              </Link>
            </div>
          )}
          {data.openTickets > 0 && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium"
              style={{
                background: 'var(--color-danger-bg)',
                borderColor: 'var(--color-danger)',
                color: 'var(--color-danger)',
              }}
            >
              <AlertCircle size={15} />
              {data.openTickets} open support ticket
              {data.openTickets !== 1 ? 's' : ''}
              <Link
                href={ROUTES.PROJECTS}
                className="ml-auto text-[12px] underline hover:opacity-70 transition-opacity"
              >
                View tickets →
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Link href={ROUTES.LEADS} className="block">
          <KpiCard
            label={role === 'member' ? 'My Leads' : 'Active Leads'}
            value={data.kpis.activeLeads}
            sub={data.kpis.activeLeadsSub}
            subVariant={data.kpis.activeLeadsSub.includes('↑') ? 'success' : 'muted'}
          />
        </Link>
        {role !== 'member' && (
          <Link href={ROUTES.PROJECTS} className="block">
            <KpiCard
              label="Active Projects"
              value={data.kpis.activeProjects}
              sub={data.kpis.activeProjectsSub}
              subVariant="success"
            />
          </Link>
        )}
        {role === 'member' && (
          <Link href={ROUTES.TASKS} className="block">
            <KpiCard
              label="My Tasks"
              value={data.kpis.tasksDueToday}
              sub={data.kpis.tasksDueTodaySub}
              subVariant={
                data.kpis.tasksDueTodaySub.includes('overdue') ? 'danger' : 'success'
              }
            />
          </Link>
        )}
        {role !== 'member' && (
          <Link href={ROUTES.TASKS} className="block">
            <KpiCard
              label="Tasks Due Today"
              value={data.kpis.tasksDueToday}
              sub={data.kpis.tasksDueTodaySub}
              subVariant={
                data.kpis.tasksDueTodaySub.includes('overdue') ? 'danger' : 'success'
              }
            />
          </Link>
        )}
        <Link href={ROUTES.LEADS} className="block">
          <KpiCard
            label="Follow-ups Due"
            value={data.kpis.followUpsDue}
            sub={data.kpis.followUpsSub}
            subVariant={data.kpis.followUpsDue > 0 ? 'warning' : 'muted'}
          />
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)] mr-1">
          Quick Actions
        </span>
        <Link
          href={`${ROUTES.LEADS}?new=true`}
          className="flex items-center gap-1.5 h-[30px] px-3 rounded-lg text-[12px] font-medium border transition-colors hover:bg-[var(--color-surface-hover)]"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-body)',
          }}
        >
          <Plus size={12} />
          New Lead
        </Link>
        {(isAdmin || isManager) && (
          <Link
            href={`${ROUTES.PROJECTS}?new=true`}
            className="flex items-center gap-1.5 h-[30px] px-3 rounded-lg text-[12px] font-medium border transition-colors hover:bg-[var(--color-surface-hover)]"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-body)',
            }}
          >
            <Plus size={12} />
            New Project
          </Link>
        )}
        <Link
          href={`${ROUTES.TASKS}?new=true`}
          className="flex items-center gap-1.5 h-[30px] px-3 rounded-lg text-[12px] font-medium border transition-colors hover:bg-[var(--color-surface-hover)]"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-body)',
          }}
        >
          <Plus size={12} />
          New Task
        </Link>
        {isAdmin && (
          <Link
            href={ROUTES.TEAM}
            className="flex items-center gap-1.5 h-[30px] px-3 rounded-lg text-[12px] font-medium border transition-colors hover:bg-[var(--color-surface-hover)]"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-body)',
            }}
          >
            <Plus size={12} />
            Invite Member
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 mb-4">
        <RecentLeads
          leads={data.recentLeads.map((l) => ({
            name: l.name,
            company: l.company ?? '',
            stage: l.stage,
            date: l.date,
          }))}
        />
        <ActivityFeed items={data.activity} />
      </div>

      {data.tasksDueToday.length > 0 ? (
        <TasksDueToday tasks={data.tasksDueToday} />
      ) : (
        <div
          className="rounded-xl border p-8 text-center"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <p className="text-[14px] font-medium text-[var(--color-text-muted)]">
            No tasks due today
          </p>
        </div>
      )}
    </DashboardShell>
  )
}
