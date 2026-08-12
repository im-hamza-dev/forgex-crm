import { DashboardShell } from '@/components/layout'
import {
  KpiCard,
  RecentLeads,
  ActivityFeed,
  TasksDueToday,
} from '@/components/dashboard'

const MOCK_LEADS = [
  { name: 'Sarah Chen', company: 'Acme Health Co', stage: 'Qualified', date: '2026-08-13' },
  { name: 'Marcus Webb', company: 'PayFlow SaaS', stage: 'Proposal Sent', date: '2026-08-11' },
  { name: 'Priya Sharma', company: 'GrowthOS', stage: 'Contacted', date: '2026-08-15' },
  { name: 'James Okafor', company: 'NovaBuild', stage: 'Negotiation', date: '2026-08-12' },
  { name: 'David Reyes', company: 'ClinicOS', stage: 'New Lead', date: '2026-08-20' },
]

const MOCK_ACTIVITY = [
  { text: 'PayFlow SaaS moved to Proposal Sent', time: '1h ago' },
  { text: 'Hamza added a note to NovaBuild', time: '3h ago' },
  { text: 'Sara Ahmed updated Patient Acquisition System to 68%', time: '5h ago' },
  { text: 'Zain submitted a blog post for review', time: 'Yesterday' },
  { text: 'ClinicOS added as a new lead', time: 'Yesterday' },
]

const MOCK_TASKS = [
  {
    title: 'Build appointment booking API',
    project: 'Patient Acquisition System',
    priority: 'Urgent' as const,
    assigneeName: 'Hamza Iqbal',
    due: '2026-08-11',
    overdue: true,
  },
  {
    title: 'Design patient dashboard UI',
    project: 'Patient Acquisition System',
    priority: 'High' as const,
    assigneeName: 'Sara Ahmed',
    due: '2026-08-14',
  },
  {
    title: 'CRM integration spec',
    project: 'B2B Pipeline OS',
    priority: 'Medium' as const,
    assigneeName: 'Sara Ahmed',
    due: '2026-08-12',
  },
  {
    title: 'Discovery call follow-up deck',
    project: 'Coaching Growth Platform',
    priority: 'Low' as const,
    assigneeName: 'Hamza Iqbal',
    due: '2026-08-11',
    overdue: true,
  },
  {
    title: 'Review client feedback doc',
    project: 'B2B Pipeline OS',
    priority: 'High' as const,
    assigneeName: 'Sara Ahmed',
    due: '2026-08-11',
    overdue: true,
  },
]

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

export default function DashboardPage() {
  return (
    <DashboardShell title="Dashboard" notificationCount={3}>
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-[28px] font-bold leading-tight text-[var(--color-text-heading)]">
          {getGreeting()}, Hamza
        </h2>
        <span className="text-[13px] text-[var(--color-text-muted)]">
          {getFormattedDate()}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Active Leads"
          value="12"
          sub="↑ 3 this week"
          subVariant="success"
        />
        <KpiCard
          label="Active Projects"
          value="4"
          sub="2 on track"
          subVariant="success"
        />
        <KpiCard
          label="Tasks Due Today"
          value="7"
          sub="3 overdue"
          subVariant="danger"
        />
        <KpiCard
          label="Follow-ups Due"
          value="5"
          sub="Due today"
          subVariant="warning"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 mb-4">
        <RecentLeads leads={MOCK_LEADS} />
        <ActivityFeed items={MOCK_ACTIVITY} />
      </div>

      <TasksDueToday tasks={MOCK_TASKS} />
    </DashboardShell>
  )
}
