export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          community_user_id: string | null
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["blog_comment_status"]
          team_user_id: string | null
          updated_at: string
        }
        Insert: {
          community_user_id?: string | null
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["blog_comment_status"]
          team_user_id?: string | null
          updated_at?: string
        }
        Update: {
          community_user_id?: string | null
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["blog_comment_status"]
          team_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_community_user_id_fkey"
            columns: ["community_user_id"]
            isOneToOne: false
            referencedRelation: "community_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_team_user_id_fkey"
            columns: ["team_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          allow_comments: boolean
          author_id: string
          body: Json | null
          canonical_url: string | null
          category_id: string | null
          community_author_id: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_community_post: boolean
          is_featured: boolean
          og_image_url: string | null
          publish_date: string | null
          published_at: string | null
          reading_time_minutes: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["blog_post_status"]
          tags: string[]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          allow_comments?: boolean
          author_id: string
          body?: Json | null
          canonical_url?: string | null
          category_id?: string | null
          community_author_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_community_post?: boolean
          is_featured?: boolean
          og_image_url?: string | null
          publish_date?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          tags?: string[]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          allow_comments?: boolean
          author_id?: string
          body?: Json | null
          canonical_url?: string | null
          category_id?: string | null
          community_author_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_community_post?: boolean
          is_featured?: boolean
          og_image_url?: string | null
          publish_date?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_community_author_id_fkey"
            columns: ["community_author_id"]
            isOneToOne: false
            referencedRelation: "community_users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_accounts: {
        Row: {
          auth_user_id: string | null
          company: string | null
          created_at: string
          created_by: string
          email: string
          full_name: string
          id: string
          invite_sent_at: string | null
          invite_token: string | null
          project_id: string
          status: Database["public"]["Enums"]["client_account_status"]
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          company?: string | null
          created_at?: string
          created_by: string
          email: string
          full_name: string
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["client_account_status"]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          company?: string | null
          created_at?: string
          created_by?: string
          email?: string
          full_name?: string
          id?: string
          invite_sent_at?: string | null
          invite_token?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["client_account_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_accounts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_document_sends: {
        Row: {
          client_account_id: string | null
          document_id: string | null
          id: string
          sent_at: string | null
          sent_by: string | null
          snapshot_body: Json | null
          snapshot_content_type: string | null
          snapshot_file_url: string | null
          snapshot_source_file_url: string | null
          snapshot_title: string | null
          viewed_at: string | null
        }
        Insert: {
          client_account_id?: string | null
          document_id?: string | null
          id?: string
          sent_at?: string | null
          sent_by?: string | null
          snapshot_body?: Json | null
          snapshot_content_type?: string | null
          snapshot_file_url?: string | null
          snapshot_source_file_url?: string | null
          snapshot_title?: string | null
          viewed_at?: string | null
        }
        Update: {
          client_account_id?: string | null
          document_id?: string | null
          id?: string
          sent_at?: string | null
          sent_by?: string | null
          snapshot_body?: Json | null
          snapshot_content_type?: string | null
          snapshot_file_url?: string | null
          snapshot_source_file_url?: string | null
          snapshot_title?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_document_sends_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_document_sends_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "client_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_document_sends_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          body: Json | null
          content_type: string
          created_at: string | null
          created_by: string | null
          document_type: string
          excerpt: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          mime_type: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          body?: Json | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          document_type?: string
          excerpt?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: Json | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          document_type?: string
          excerpt?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          mime_type?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_ticket_messages: {
        Row: {
          attachments: Json
          client_sender_id: string | null
          content: string
          created_at: string
          id: string
          sender_type: Database["public"]["Enums"]["ticket_sender_type"]
          team_sender_id: string | null
          ticket_id: string
        }
        Insert: {
          attachments?: Json
          client_sender_id?: string | null
          content: string
          created_at?: string
          id?: string
          sender_type: Database["public"]["Enums"]["ticket_sender_type"]
          team_sender_id?: string | null
          ticket_id: string
        }
        Update: {
          attachments?: Json
          client_sender_id?: string | null
          content?: string
          created_at?: string
          id?: string
          sender_type?: Database["public"]["Enums"]["ticket_sender_type"]
          team_sender_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_ticket_messages_client_sender_id_fkey"
            columns: ["client_sender_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_ticket_messages_team_sender_id_fkey"
            columns: ["team_sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "client_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      client_tickets: {
        Row: {
          client_account_id: string
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          project_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          client_account_id: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          client_account_id?: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_tickets_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_users: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          email: string
          id?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_calendar: {
        Row: {
          assigned_to: string | null
          blog_post_id: string | null
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          entry_type: string
          id: string
          is_all_day: boolean
          notes: string | null
          planned_date: string | null
          scheduled_time: string | null
          source_id: string | null
          source_type: string | null
          status: Database["public"]["Enums"]["calendar_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          blog_post_id?: string | null
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          entry_type?: string
          id?: string
          is_all_day?: boolean
          notes?: string | null
          planned_date?: string | null
          scheduled_time?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["calendar_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          blog_post_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          entry_type?: string
          id?: string
          is_all_day?: boolean
          notes?: string | null
          planned_date?: string | null
          scheduled_time?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["calendar_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_calendar_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_docs: {
        Row: {
          author_id: string
          category: string | null
          content: Json | null
          created_at: string
          excerpt: string | null
          id: string
          is_shared: boolean
          last_edited_by: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string | null
          content?: Json | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_shared?: boolean
          last_edited_by?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string | null
          content?: Json | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_shared?: boolean
          last_edited_by?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_docs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_docs_last_edited_by_fkey"
            columns: ["last_edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activity: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string
          created_at: string
          id: string
          lead_id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name: string
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lead_activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activity_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          lead_id: string
          mime_type: string | null
          note_id: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          lead_id: string
          mime_type?: string | null
          note_id?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          lead_id?: string
          mime_type?: string | null
          note_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_attachments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_attachments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "lead_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          lead_id: string
          note_type: Database["public"]["Enums"]["lead_note_type"]
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          lead_id: string
          note_type?: Database["public"]["Enums"]["lead_note_type"]
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          note_type?: Database["public"]["Enums"]["lead_note_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget_range: string | null
          company: string | null
          contact_name: string
          converted_project_id: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          last_contacted_at: string | null
          lead_score: number | null
          linkedin_url: string | null
          next_follow_up: string | null
          phone: string | null
          priority: Database["public"]["Enums"]["lead_priority"]
          service_interest: Database["public"]["Enums"]["service_type"] | null
          source: Database["public"]["Enums"]["lead_source"]
          stage: Database["public"]["Enums"]["lead_stage"]
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget_range?: string | null
          company?: string | null
          contact_name: string
          converted_project_id?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_score?: number | null
          linkedin_url?: string | null
          next_follow_up?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          service_interest?: Database["public"]["Enums"]["service_type"] | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget_range?: string | null
          company?: string | null
          contact_name?: string
          converted_project_id?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_score?: number | null
          linkedin_url?: string | null
          next_follow_up?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          service_interest?: Database["public"]["Enums"]["service_type"] | null
          source?: Database["public"]["Enums"]["lead_source"]
          stage?: Database["public"]["Enums"]["lead_stage"]
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_project_id_fkey"
            columns: ["converted_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          body: string | null
          created_at: string
          email_sent: boolean
          email_sent_at: string | null
          id: string
          is_dismissed: boolean
          is_read: boolean
          metadata: Json
          read_at: string | null
          reference_id: string | null
          reference_type:
            | Database["public"]["Enums"]["notification_reference_type"]
            | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          body?: string | null
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          reference_id?: string | null
          reference_type?:
            | Database["public"]["Enums"]["notification_reference_type"]
            | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          body?: string | null
          created_at?: string
          email_sent?: boolean
          email_sent_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          reference_id?: string | null
          reference_type?:
            | Database["public"]["Enums"]["notification_reference_type"]
            | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["team_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string
        }
        Relationships: []
      }
      project_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          is_client_visible: boolean
          mime_type: string | null
          project_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          is_client_visible?: boolean
          mime_type?: string | null
          project_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_client_visible?: boolean
          mime_type?: string | null
          project_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          added_at: string
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_client_visible: boolean
          project_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_client_visible?: boolean
          project_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_client_visible?: boolean
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_account_id: string | null
          completion_pct: number
          created_at: string
          created_by: string
          currency: string
          deadline: string | null
          description: string | null
          fixed_price: number | null
          id: string
          is_client_visible: boolean
          name: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          service_type: Database["public"]["Enums"]["service_type"] | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          client_account_id?: string | null
          completion_pct?: number
          created_at?: string
          created_by: string
          currency?: string
          deadline?: string | null
          description?: string | null
          fixed_price?: number | null
          id?: string
          is_client_visible?: boolean
          name: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          service_type?: Database["public"]["Enums"]["service_type"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          client_account_id?: string | null
          completion_pct?: number
          created_at?: string
          created_by?: string
          currency?: string
          deadline?: string | null
          description?: string | null
          fixed_price?: number | null
          id?: string
          is_client_visible?: boolean
          name?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          service_type?: Database["public"]["Enums"]["service_type"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_account_id_fkey"
            columns: ["client_account_id"]
            isOneToOne: false
            referencedRelation: "client_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          milestone_id: string | null
          parent_task_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          milestone_id?: string | null
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          milestone_id?: string | null
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      video_events: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device: string | null
          event_type: string
          id: string
          ip: string | null
          os: string | null
          referrer: string | null
          user_agent: string | null
          video_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          event_type: string
          id?: string
          ip?: string | null
          os?: string | null
          referrer?: string | null
          user_agent?: string | null
          video_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          event_type?: string
          id?: string
          ip?: string | null
          os?: string | null
          referrer?: string | null
          user_agent?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_events_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          is_public: boolean
          mime_type: string | null
          play_count: number
          slug: string
          storage_path: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          is_public?: boolean
          mime_type?: string | null
          play_count?: number
          slug: string
          storage_path: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          is_public?: boolean
          mime_type?: string | null
          play_count?: number
          slug?: string
          storage_path?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "videos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      blog_posts_fts_vector: {
        Args: { excerpt: string; tags: string[]; title: string }
        Returns: unknown
      }
      create_notification:
        | {
            Args: {
              p_body?: string
              p_reference_id?: string
              p_reference_type?: Database["public"]["Enums"]["notification_reference_type"]
              p_title: string
              p_type: Database["public"]["Enums"]["notification_type"]
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_actor_id?: string
              p_actor_name?: string
              p_body?: string
              p_metadata?: Json
              p_reference_id?: string
              p_reference_type?: Database["public"]["Enums"]["notification_reference_type"]
              p_title: string
              p_type: Database["public"]["Enums"]["notification_type"]
              p_user_id: string
            }
            Returns: string
          }
      internal_docs_fts_vector: {
        Args: { category: string; title: string }
        Returns: unknown
      }
      leads_fts_vector: {
        Args: { company: string; contact_name: string; email: string }
        Returns: unknown
      }
      notification_already_sent: {
        Args: {
          p_reference_id: string
          p_type: Database["public"]["Enums"]["notification_type"]
          p_user_id: string
        }
        Returns: boolean
      }
      process_due_date_notifications: { Args: never; Returns: undefined }
      record_video_event: {
        Args: {
          p_browser?: string
          p_city?: string
          p_country?: string
          p_device?: string
          p_event_type: string
          p_ip?: string
          p_os?: string
          p_referrer?: string
          p_user_agent?: string
          p_video_id: string
        }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      blog_comment_status: "pending" | "approved" | "rejected"
      blog_post_status:
        | "draft"
        | "in_review"
        | "scheduled"
        | "published"
        | "archived"
      calendar_status:
        | "idea"
        | "draft"
        | "in_review"
        | "scheduled"
        | "published"
      client_account_status: "pending" | "active" | "revoked"
      lead_note_type: "note" | "meeting" | "email" | "call" | "whatsapp"
      lead_priority: "hot" | "warm" | "cold"
      lead_source:
        | "website_form"
        | "referral"
        | "cold_outreach"
        | "social"
        | "other"
      lead_stage:
        | "new_lead"
        | "contacted"
        | "qualified"
        | "proposal_sent"
        | "negotiation"
        | "won"
        | "lost"
      lead_status: "active" | "won" | "lost" | "archived"
      notification_reference_type:
        | "lead"
        | "project"
        | "task"
        | "ticket"
        | "blog_post"
        | "blog_comment"
        | "milestone"
        | "calendar"
        | "client_document"
      notification_type:
        | "lead_assigned"
        | "follow_up_due"
        | "ticket_raised"
        | "ticket_reply"
        | "blog_needs_review"
        | "task_assigned"
        | "project_updated"
        | "client_invited"
        | "comment_needs_moderation"
        | "milestone_completed"
        | "project_overdue"
        | "lead_note_added"
        | "lead_stage_changed"
        | "task_completed"
        | "task_comment_added"
        | "task_due_soon"
        | "task_overdue"
        | "project_member_added"
        | "milestone_due_soon"
        | "calendar_assigned"
        | "calendar_due_today"
        | "blog_post_published"
        | "client_doc_sent"
        | "team_member_joined"
        | "ticket_opened"
      payment_status: "pending" | "partial" | "paid" | "overdue"
      project_status:
        | "discovery"
        | "in_progress"
        | "review"
        | "delivered"
        | "retainer"
        | "on_hold"
        | "cancelled"
      service_type:
        | "saas_mvp"
        | "workflow_automation"
        | "custom_crm"
        | "ai_agents"
        | "tech_retainer"
        | "other"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "review" | "done"
      team_role: "admin" | "manager" | "member" | "client"
      ticket_priority: "low" | "medium" | "high"
      ticket_sender_type: "client" | "team"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      blog_comment_status: ["pending", "approved", "rejected"],
      blog_post_status: [
        "draft",
        "in_review",
        "scheduled",
        "published",
        "archived",
      ],
      calendar_status: ["idea", "draft", "in_review", "scheduled", "published"],
      client_account_status: ["pending", "active", "revoked"],
      lead_note_type: ["note", "meeting", "email", "call", "whatsapp"],
      lead_priority: ["hot", "warm", "cold"],
      lead_source: [
        "website_form",
        "referral",
        "cold_outreach",
        "social",
        "other",
      ],
      lead_stage: [
        "new_lead",
        "contacted",
        "qualified",
        "proposal_sent",
        "negotiation",
        "won",
        "lost",
      ],
      lead_status: ["active", "won", "lost", "archived"],
      notification_reference_type: [
        "lead",
        "project",
        "task",
        "ticket",
        "blog_post",
        "blog_comment",
        "milestone",
        "calendar",
        "client_document",
      ],
      notification_type: [
        "lead_assigned",
        "follow_up_due",
        "ticket_raised",
        "ticket_reply",
        "blog_needs_review",
        "task_assigned",
        "project_updated",
        "client_invited",
        "comment_needs_moderation",
        "milestone_completed",
        "project_overdue",
        "lead_note_added",
        "lead_stage_changed",
        "task_completed",
        "task_comment_added",
        "task_due_soon",
        "task_overdue",
        "project_member_added",
        "milestone_due_soon",
        "calendar_assigned",
        "calendar_due_today",
        "blog_post_published",
        "client_doc_sent",
        "team_member_joined",
        "ticket_opened",
      ],
      payment_status: ["pending", "partial", "paid", "overdue"],
      project_status: [
        "discovery",
        "in_progress",
        "review",
        "delivered",
        "retainer",
        "on_hold",
        "cancelled",
      ],
      service_type: [
        "saas_mvp",
        "workflow_automation",
        "custom_crm",
        "ai_agents",
        "tech_retainer",
        "other",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["todo", "in_progress", "review", "done"],
      team_role: ["admin", "manager", "member", "client"],
      ticket_priority: ["low", "medium", "high"],
      ticket_sender_type: ["client", "team"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
