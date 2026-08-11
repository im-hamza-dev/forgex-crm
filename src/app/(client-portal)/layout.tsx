export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist">
      <header className="bg-ash text-paper p-4">
        <span className="font-display font-bold text-electric-lime">Forgex</span>
        <span className="text-pebble text-sm ml-2">Client Portal</span>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
