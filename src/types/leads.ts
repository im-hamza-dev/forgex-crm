import type { Database } from './database.types'

export type Lead = Database['public']['Tables']['leads']['Row'] & {
  assigned_profile?: { full_name: string | null; avatar_url: string | null } | null
  created_profile?: { full_name: string | null; avatar_url: string | null } | null
  /** Denormalized for table/card helpers */
  assignee_name?: string | null
  assignee_avatar?: string | null
}

export type LeadInsert = Database['public']['Tables']['leads']['Insert']
export type LeadUpdate = Database['public']['Tables']['leads']['Update']

export type LeadNote = Database['public']['Tables']['lead_notes']['Row'] & {
  author?: { full_name: string | null; avatar_url: string | null } | null
}

export type LeadAttachment =
  Database['public']['Tables']['lead_attachments']['Row'] & {
    uploader?: { full_name: string | null; avatar_url: string | null } | null
  }

export type LeadActivityAction =
  | 'lead_created'
  | 'stage_changed'
  | 'note_added'
  | 'note_deleted'
  | 'attachment_added'
  | 'attachment_deleted'
  | 'lead_assigned'
  | 'lead_updated'
  | 'lead_deleted'

export type LeadActivity = {
  id: string
  lead_id: string
  actor_id: string | null
  actor_name: string
  action: LeadActivityAction
  metadata: Record<string, unknown>
  created_at: string
}

/** Matches public.lead_stage */
export type LeadStage = Database['public']['Enums']['lead_stage']

/** Matches public.lead_priority */
export type LeadPriority = Database['public']['Enums']['lead_priority']

/** Matches public.lead_status (active | won | lost | archived) */
export type LeadStatus = Database['public']['Enums']['lead_status']

/** Matches public.lead_source */
export type LeadSource = Database['public']['Enums']['lead_source']

/** Matches public.lead_note_type */
export type LeadNoteType = Database['public']['Enums']['lead_note_type']

export type LeadFilters = {
  stage?: string
  search?: string
  assigned_to?: string
  priority?: string
  status?: string
}
