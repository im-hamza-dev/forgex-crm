import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'forge-black':    'var(--forge-black)',
        'electric-lime':  'var(--electric-lime)',
        'dim-lime':       'var(--dim-lime)',
        'ash':            'var(--ash)',
        'smoke':          'var(--smoke)',
        'mist':           'var(--mist)',
        'fog':            'var(--fog)',
        'pebble':         'var(--pebble)',
        'paper':          'var(--paper)',
        'btn-text':       'var(--btn-text)',
        destructive:      'var(--destructive)',
        success:          'var(--success)',
        warning:          'var(--warning)',
      },
      borderRadius: {
        card:    'var(--radius-card)',
        surface: 'var(--radius-surface)',
        btn:     'var(--radius-btn)',
        input:   'var(--radius-input)',
      },
      fontFamily: {
        inter:   ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        modal:  '0 20px 60px rgba(0,0,0,0.15)',
        panel:  '0 8px 32px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}

export default config
