-- ============================================================
-- 00_core / 001_extensions_and_enums.sql
-- Enable extensions and define all shared enum types.
-- Run this first — every other migration depends on these.
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";       -- trigram indexes for text search
create extension if not exists "unaccent";       -- accent-insensitive search

-- ============================================================
-- ENUM: team member roles
-- ============================================================
create type team_role as enum ('admin', 'manager', 'member');

-- ============================================================
-- ENUM: lead pipeline stages
-- ============================================================
create type lead_stage as enum (
  'new_lead',
  'contacted',
  'qualified',
  'proposal_sent',
  'negotiation',
  'won',
  'lost'
);

-- ============================================================
-- ENUM: lead status (lifecycle)
-- ============================================================
create type lead_status as enum ('active', 'won', 'lost', 'archived');

-- ============================================================
-- ENUM: lead priority
-- ============================================================
create type lead_priority as enum ('hot', 'warm', 'cold');

-- ============================================================
-- ENUM: lead source
-- ============================================================
create type lead_source as enum (
  'website_form',
  'referral',
  'cold_outreach',
  'social',
  'other'
);

-- ============================================================
-- ENUM: lead note type
-- ============================================================
create type lead_note_type as enum ('note', 'meeting', 'email', 'call', 'whatsapp');

-- ============================================================
-- ENUM: project status
-- ============================================================
create type project_status as enum (
  'discovery',
  'in_progress',
  'review',
  'delivered',
  'retainer',
  'on_hold',
  'cancelled'
);

-- ============================================================
-- ENUM: payment status
-- ============================================================
create type payment_status as enum ('pending', 'partial', 'paid', 'overdue');

-- ============================================================
-- ENUM: task status
-- ============================================================
create type task_status as enum ('todo', 'in_progress', 'review', 'done');

-- ============================================================
-- ENUM: task priority
-- ============================================================
create type task_priority as enum ('low', 'medium', 'high', 'urgent');

-- ============================================================
-- ENUM: blog post status
-- ============================================================
create type blog_post_status as enum ('draft', 'in_review', 'scheduled', 'published', 'archived');

-- ============================================================
-- ENUM: blog comment status
-- ============================================================
create type blog_comment_status as enum ('pending', 'approved', 'rejected');

-- ============================================================
-- ENUM: content calendar status
-- ============================================================
create type calendar_status as enum ('idea', 'draft', 'in_review', 'scheduled', 'published');

-- ============================================================
-- ENUM: client account status
-- ============================================================
create type client_account_status as enum ('pending', 'active', 'revoked');

-- ============================================================
-- ENUM: ticket status
-- ============================================================
create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');

-- ============================================================
-- ENUM: ticket priority
-- ============================================================
create type ticket_priority as enum ('low', 'medium', 'high');

-- ============================================================
-- ENUM: ticket message sender type
-- ============================================================
create type ticket_sender_type as enum ('client', 'team');

-- ============================================================
-- ENUM: notification type
-- ============================================================
create type notification_type as enum (
  'lead_assigned',
  'follow_up_due',
  'ticket_raised',
  'ticket_reply',
  'blog_needs_review',
  'task_assigned',
  'project_updated',
  'client_invited',
  'comment_needs_moderation',
  'milestone_completed',
  'project_overdue'
);

-- ============================================================
-- ENUM: notification reference type (polymorphic pointer)
-- ============================================================
create type notification_reference_type as enum (
  'lead',
  'project',
  'task',
  'ticket',
  'blog_post',
  'blog_comment',
  'milestone'
);

-- ============================================================
-- ENUM: service type (what Forgex builds)
-- ============================================================
create type service_type as enum (
  'saas_mvp',
  'workflow_automation',
  'custom_crm',
  'ai_agents',
  'tech_retainer',
  'other'
);