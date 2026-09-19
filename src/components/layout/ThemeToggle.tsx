'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative flex items-center justify-center w-9 h-9 rounded-lg',
        'transition-colors',
        'hover:bg-[var(--color-surface-hover)]',
        'outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun
          size={18}
          strokeWidth={1.75}
          className="text-[var(--color-text-secondary)]"
        />
      ) : (
        <Moon
          size={18}
          strokeWidth={1.75}
          className="text-[var(--color-text-secondary)]"
        />
      )}
    </button>
  )
}
