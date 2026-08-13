import type { Database } from './database.types'

export type Project = Database['public']['Tables']['projects']['Row'] & {
  client_account?: {
    id: string
    full_name: string
    company: string | null
    email: string
    status: string
  } | null
  members?: ProjectMember[]
}

export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type ProjectMember = {
  id: string
  project_id: string
  user_id: string
  added_at: string
  profile?: {
    full_name: string | null
    avatar_url: string | null
    role: string
  } | null
}

export type ProjectMilestone =
  Database['public']['Tables']['project_milestones']['Row'] & {
    creator?: { full_name: string | null; avatar_url: string | null } | null
  }

export type ProjectFeedUpdate =
  Database['public']['Tables']['project_updates']['Row'] & {
    author?: { full_name: string | null; avatar_url: string | null } | null
  }

/** Alias matching prompt naming */
export type ProjectUpdate2 = ProjectFeedUpdate

export type ProjectFile =
  Database['public']['Tables']['project_files']['Row'] & {
    uploader?: { full_name: string | null; avatar_url: string | null } | null
  }

export type ClientTicket =
  Database['public']['Tables']['client_tickets']['Row'] & {
    client_account?: {
      full_name: string
      company: string | null
      email: string
    } | null
    messages?: TicketMessage[]
  }

export type TicketMessage =
  Database['public']['Tables']['client_ticket_messages']['Row'] & {
    team_sender?: {
      full_name: string | null
      avatar_url: string | null
    } | null
    client_sender?: { full_name: string | null } | null
  }

export type ProjectStatus = Database['public']['Enums']['project_status']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type ServiceType = Database['public']['Enums']['service_type']

export type ProjectTaskRow = Database['public']['Tables']['tasks']['Row'] & {
  assignee?: {
    full_name: string | null
    avatar_url: string | null
  } | null
}
