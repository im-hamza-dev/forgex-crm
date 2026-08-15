export type DocCategory =
  | 'SOPs'
  | 'Playbooks'
  | 'Templates'
  | 'Research'
  | 'Meeting Notes'
  | 'Processes'
  | 'Other'

export type DocStatus = 'draft' | 'published'

export type DocumentType =
  | 'welcome'
  | 'nda'
  | 'thankyou'
  | 'recommendation'
  | 'proposal'
  | 'contract'
  | 'other'

export type ContentType = 'editor' | 'pdf'

export interface InternalDoc {
  id: string
  title: string
  content: Record<string, unknown> | string | null
  category: DocCategory
  is_shared: boolean
  author_id: string
  status: DocStatus
  tags: string[]
  excerpt: string | null
  last_edited_by: string | null
  created_at: string
  updated_at: string
  author?: { full_name: string | null; avatar_url: string | null } | null
  last_editor?: { full_name: string | null; avatar_url: string | null } | null
}

export interface ClientDocument {
  id: string
  title: string
  document_type: DocumentType
  content_type: ContentType
  body: Record<string, unknown> | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  excerpt: string | null
  tags: string[]
  created_by: string
  created_at: string
  updated_at: string
  creator?: { full_name: string | null; avatar_url: string | null } | null
  sends?: ClientDocumentSend[]
}

export interface ClientDocumentSend {
  id: string
  document_id: string
  client_account_id: string
  sent_by: string
  sent_at: string
  viewed_at: string | null
  client_account?: {
    full_name: string
    company: string | null
    email: string
  } | null
}

export type DocFilter = 'all' | 'my' | 'shared' | DocCategory

export type Doc = InternalDoc
export type { DocCategory as DocCategoryType }

export type ClientAccountOption = {
  id: string
  full_name: string
  company: string | null
  email: string
}
