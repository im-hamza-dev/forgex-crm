'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

const OPTIONS = [
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
  'This month',
  'Last month',
  'This quarter',
]

interface DateRangeDropdownProps {
  value: string
}

export function DateRangeDropdown({ value }: DateRangeDropdownProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleChange = (v: string) => {
    setOpen(false)
    router.push(`/reports?range=${encodeURIComponent(v)}`)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-[34px] px-3 rounded-lg text-[13px] font-medium border transition-colors hover:bg-[var(--color-surface-hover)]"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-body)' }}
      >
        {value}
        <ChevronDown size={13} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-10 py-1 min-w-[160px] bg-[var(--color-surface)] rounded-lg border shadow-[0_4px_16px_rgba(26,16,8,0.10)]"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => handleChange(opt)}
              className="w-full text-left px-4 h-[36px] text-[13px] transition-colors hover:bg-[var(--color-surface-hover)]"
              style={{
                color: opt === value ? 'var(--color-accent)' : 'var(--color-text-body)',
                fontWeight: opt === value ? 600 : 400,
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
