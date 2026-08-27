import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/constants/routes'
import { DashboardShell } from '@/components/layout'

export const metadata = { title: 'Subscribers' }

function formatSubscribedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatSourceSlug(slug: string | null): string {
  if (!slug) return '—'
  return slug.replace(/-/g, ' ')
}

export default async function BlogSubscribersPage() {
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

  if (profile?.role !== 'admin' && profile?.role !== 'manager') {
    redirect(ROUTES.DASHBOARD)
  }

  const { data: subscribers, error } = await supabase
    .from('blog_subscribers')
    .select('id, email, source_post_slug, subscribed_at, status')
    .order('subscribed_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const rows = subscribers ?? []
  const count = rows.length

  return (
    <DashboardShell title="Subscribers">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2
            className="text-[22px] font-bold leading-tight mb-1"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Subscribers
          </h2>
          <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
            {count} subscriber{count === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {count === 0 ? (
        <div
          className="flex items-center justify-center rounded-xl border min-h-[240px]"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <p
            className="text-[14px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            No subscribers yet.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr
                  className="border-b"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {['Email', 'Source post', 'Subscribed', 'Status'].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isActive = row.status === 'active'
                  return (
                    <tr
                      key={row.id}
                      className="border-b last:border-b-0"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <td
                        className="px-4 py-3 text-[13px] font-medium"
                        style={{ color: 'var(--color-text-heading)' }}
                      >
                        {row.email}
                      </td>
                      <td
                        className="px-4 py-3 text-[13px] capitalize"
                        style={{ color: 'var(--color-text-body)' }}
                      >
                        {formatSourceSlug(row.source_post_slug)}
                      </td>
                      <td
                        className="px-4 py-3 text-[13px]"
                        style={{ color: 'var(--color-text-body)' }}
                      >
                        {formatSubscribedDate(row.subscribed_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                          style={
                            isActive
                              ? {
                                  background: 'var(--color-success-bg)',
                                  color: 'var(--color-success)',
                                }
                              : {
                                  background: 'var(--color-surface-hover)',
                                  color: 'var(--color-text-muted)',
                                }
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
