import { DashboardShell } from '@/components/layout'
import {
  LeadPipelineChart,
  LeadSourcesChart,
  RevenueCard,
  ActiveProjectsTable,
  TeamActivityTable,
  DateRangeDropdown,
} from '@/components/reports'
import { getReportsData } from '@/server/reports/reports.server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/constants/routes'

interface ReportsPageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(ROUTES.LOGIN)

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect(ROUTES.DASHBOARD)

  const { range = 'Last 30 days' } = await searchParams
  const data = await getReportsData(range)

  return (
    <DashboardShell title="Reports">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[22px] font-bold" style={{ color: 'var(--color-text-heading)' }}>
          Reports
        </h2>
        <DateRangeDropdown value={range} />
      </div>

      <div className="mb-4">
        <LeadPipelineChart stages={data.pipelineStages} kpis={data.pipelineKpis} />
      </div>

      <div className="flex gap-4 mb-4">
        <LeadSourcesChart sources={data.leadSources} />
        <RevenueCard data={data.revenue} />
      </div>

      <div className="mb-4">
        <ActiveProjectsTable projects={data.activeProjects} />
      </div>

      <TeamActivityTable stats={data.teamStats} />
    </DashboardShell>
  )
}
