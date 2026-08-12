export function AuthDivider({ label = 'Or continue with' }: { label?: string }) {
  return (
    <div className="relative flex items-center my-5">
      <div className="flex-1 h-px bg-[var(--color-border)]" />
      <span className="mx-3 text-[12px] text-[var(--color-text-muted)]">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  )
}
