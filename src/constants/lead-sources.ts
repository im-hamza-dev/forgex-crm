import { z } from 'zod'

export const LEAD_SOURCE_VALUES = [
  'linkedin',
  'upwork',
  'instagram',
  'facebook',
  'website',
  'indiehacker',
  'socials',
  'twitter',
] as const

export type LeadSourceValue = (typeof LEAD_SOURCE_VALUES)[number]

export const LEAD_SOURCES: { value: LeadSourceValue; label: string }[] = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'upwork', label: 'Upwork' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'website', label: 'Website' },
  { value: 'indiehacker', label: 'Indie Hackers' },
  { value: 'socials', label: 'Socials' },
  { value: 'twitter', label: 'Twitter' },
]

const LEGACY_SOURCE_VALUES = [
  'website_form',
  'referral',
  'cold_outreach',
  'social',
  'other',
] as const

const LEGACY_SOURCE_LABELS: Record<string, string> = {
  website_form: 'Website',
  referral: 'Referral',
  cold_outreach: 'Cold outreach',
  social: 'Socials',
  other: 'Other',
}

export const LEAD_SOURCE_CREATE_SCHEMA = z.enum(LEAD_SOURCE_VALUES)

export const LEAD_SOURCE_SCHEMA = z.union([
  LEAD_SOURCE_CREATE_SCHEMA,
  z.enum(LEGACY_SOURCE_VALUES),
])

export function getSourceLabel(source: string): string {
  return (
    LEAD_SOURCES.find((s) => s.value === source)?.label ??
    LEGACY_SOURCE_LABELS[source] ??
    source
  )
}

export function sourceSelectOptions(current?: string) {
  const options = LEAD_SOURCES.map((s) => ({ value: s.value, label: s.label }))
  if (current && !options.some((o) => o.value === current)) {
    options.push({
      value: current as LeadSourceValue,
      label: getSourceLabel(current),
    })
  }
  return options
}
