'use client'

import { useState } from 'react'
import { DashboardShell } from '@/components/layout'
import {
  LeadPipelineChart,
  LeadSourcesChart,
  RevenueCard,
  ActiveProjectsTable,
  TeamActivityTable,
  DateRangeDropdown,
} from '@/components/reports'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('Last 30 days')

  return (
    <DashboardShell title="Reports" notificationCount={3}>
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-[22px] font-bold"
          style={{ color: 'var(--color-text-heading)' }}
        >
          Reports
        </h2>
        <DateRangeDropdown value={dateRange} onChange={setDateRange} />
      </div>

      <div className="mb-4">
        <LeadPipelineChart />
      </div>

      <div className="flex gap-4 mb-4">
        <LeadSourcesChart />
        <RevenueCard />
      </div>

      <div className="mb-4">
        <ActiveProjectsTable />
      </div>

      <TeamActivityTable />
    </DashboardShell>
  )
}
