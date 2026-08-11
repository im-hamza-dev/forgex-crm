import { Providers } from '@/components/providers'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen bg-mist">
        {/* Sidebar placeholder */}
        <aside className="w-64 bg-ash text-paper min-h-screen rounded-r-surface p-4 z-40">
          <p className="text-electric-lime font-display font-bold text-lg">Forgex CRM</p>
          <p className="text-pebble text-xs mt-2">Sidebar — coming next step</p>
        </aside>
        {/* Main content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </Providers>
  )
}
