export const TASK_PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label: 'Low',    color: '#1A3D6B' },
  medium: { label: 'Medium', color: '#8B5E00' },
  high:   { label: 'High',   color: '#8B1A1A' },
  urgent: { label: 'Urgent', color: '#8B1A1A' },
}

export const TASK_STATUS_CONFIG: Record<string, {
  label: string
  dotColor: string
  textColor: string
}> = {
  todo:        { label: 'Todo',        dotColor: '#9CA3AF', textColor: '#6B6B6B' },
  in_progress: { label: 'In Progress', dotColor: '#1A3D6B', textColor: '#1A3D6B' },
  done:        { label: 'Done',        dotColor: '#2D6A2D', textColor: '#2D6A2D' },
}

export const PROJECT_TAG_COLORS: Record<string, { bg: string; text: string }> = {
  'Patient Acquisition System': { bg: '#F3EEF8', text: '#4A1D6B' },
  'Tax AI MVP':                  { bg: '#EDF5ED', text: '#2D6A2D' },
  'B2B Pipeline OS':             { bg: '#EEF3FA', text: '#1A3D6B' },
  'Coaching Growth Platform':    { bg: '#FEF7E6', text: '#8B5E00' },
}

export function getProjectTagColor(projectName: string | null): { bg: string; text: string } {
  if (!projectName) return { bg: '#F5F5F5', text: '#6B6B6B' }
  return PROJECT_TAG_COLORS[projectName] ?? { bg: '#F5EDE6', text: '#9c6644' }
}
