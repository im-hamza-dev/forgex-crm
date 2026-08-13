import type { AuthProfile } from '@/stores/auth-store'
import type { Lead } from '@/types/leads'

export function canEditLead(profile: AuthProfile | null, lead: Lead): boolean {
  if (!profile) return false
  if (profile.role === 'admin' || profile.role === 'manager') return true
  return lead.assigned_to === profile.id || lead.created_by === profile.id
}

export function canDeleteLead(profile: AuthProfile | null, lead: Lead): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true
  if (profile.role === 'manager') {
    return lead.created_by === profile.id
  }
  return false
}

export function canMoveLead(profile: AuthProfile | null, lead: Lead): boolean {
  if (!profile) return false
  if (profile.role === 'admin' || profile.role === 'manager') return true
  return lead.assigned_to === profile.id || lead.created_by === profile.id
}

export function canAssignLead(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}

export function canAddNote(profile: AuthProfile | null, lead: Lead): boolean {
  if (!profile) return false
  if (profile.role === 'admin' || profile.role === 'manager') return true
  return lead.assigned_to === profile.id || lead.created_by === profile.id
}

export function canDeleteNote(
  profile: AuthProfile | null,
  authorId: string,
): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true
  return profile.id === authorId
}

export function canDeleteAttachment(
  profile: AuthProfile | null,
  uploadedBy: string,
): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true
  return profile.id === uploadedBy
}

export function canViewAllLeads(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}
