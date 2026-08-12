export interface ProjectStatusConfig {
  value: string
  label: string
  dotColor: string
  badgeBg: string
  badgeText: string
}

export const PROJECT_STATUSES: ProjectStatusConfig[] = [
  { value: 'discovery',   label: 'Discovery',   dotColor: '#9CA3AF', badgeBg: '#F5F5F5', badgeText: '#6B6B6B' },
  { value: 'in_progress', label: 'In Progress', dotColor: '#1A3D6B', badgeBg: '#EEF3FA', badgeText: '#1A3D6B' },
  { value: 'review',      label: 'Review',      dotColor: '#8B5E00', badgeBg: '#FEF7E6', badgeText: '#8B5E00' },
  { value: 'delivered',   label: 'Delivered',   dotColor: '#2D6A2D', badgeBg: '#EDF5ED', badgeText: '#2D6A2D' },
  { value: 'retainer',    label: 'Retainer',    dotColor: '#9c6644', badgeBg: '#F5EDE6', badgeText: '#9c6644' },
  { value: 'on_hold',     label: 'On Hold',     dotColor: '#9CA3AF', badgeBg: '#F5F5F5', badgeText: '#6B6B6B' },
]

export function getProjectStatus(value: string): ProjectStatusConfig {
  return PROJECT_STATUSES.find((s) => s.value === value) ?? PROJECT_STATUSES[0]!
}

export const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#6B6B6B', bg: '#F5F5F5' },
  partial: { label: 'Partial', color: '#8B5E00', bg: '#FEF7E6' },
  paid:    { label: 'Paid',    color: '#2D6A2D', bg: '#EDF5ED' },
  overdue: { label: 'Overdue', color: '#8B1A1A', bg: '#FDF0F0' },
}

export const TASK_PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label: 'Low',    color: '#2D6A2D' },
  medium: { label: 'Medium', color: '#1A3D6B' },
  high:   { label: 'High',   color: '#8B5E00' },
  urgent: { label: 'Urgent', color: '#8B1A1A' },
}
