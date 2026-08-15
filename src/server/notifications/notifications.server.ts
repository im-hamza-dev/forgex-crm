'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireSession } from '@/server/shared/require-session'
import { SupabaseError } from '@/server/shared/errors'
import { sendNotificationEmail } from '@/lib/notifications/email'
import type {
  Notification,
  CreateNotificationInput,
  NotificationFilters,
  NotificationType,
  NotificationReferenceType,
} from '@/types/notifications'

type NotificationRow = {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  reference_type: string | null
  reference_id: string | null
  actor_id: string | null
  actor_name: string | null
  metadata: unknown
  is_read: boolean
  is_dismissed: boolean
  email_sent: boolean
  email_sent_at: string | null
  created_at: string
  read_at: string | null
}

type ActorSnippet = {
  full_name: string | null
  avatar_url: string | null
}

function asMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function mapNotification(
  row: NotificationRow,
  actorMap: Record<string, ActorSnippet>,
): Notification {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    reference_type: (row.reference_type ??
      null) as NotificationReferenceType | null,
    reference_id: row.reference_id,
    actor_id: row.actor_id,
    actor_name: row.actor_name,
    metadata: asMetadata(row.metadata),
    is_read: row.is_read,
    is_dismissed: row.is_dismissed,
    email_sent: row.email_sent ?? false,
    email_sent_at: row.email_sent_at ?? null,
    created_at: row.created_at,
    read_at: row.read_at,
    actor: row.actor_id ? (actorMap[row.actor_id] ?? null) : null,
  }
}

function toInsertRow(input: CreateNotificationInput) {
  return {
    user_id: input.user_id,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    reference_type: input.reference_type ?? null,
    reference_id: input.reference_id ?? null,
    actor_id: input.actor_id ?? null,
    actor_name: input.actor_name ?? null,
    metadata: input.metadata ?? {},
  }
}

export async function getNotifications(
  filters: NotificationFilters = {},
): Promise<Notification[]> {
  const { user } = await requireSession()
  const client = await createClient()

  const { limit = 50, offset = 0, unread_only = false } = filters

  let query = client
    .from('notifications' as never)
    .select('*')
    .eq('user_id', user.id)
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (unread_only) {
    query = query.eq('is_read', false)
  }

  const { data, error } = await query

  if (error) throw new SupabaseError(error.message)

  const rows = (data ?? []) as unknown as NotificationRow[]

  const actorIds = [
    ...new Set(rows.map((n) => n.actor_id).filter((id): id is string => !!id)),
  ]

  const actorMap: Record<string, ActorSnippet> = {}

  if (actorIds.length > 0) {
    const service = createServiceClient()
    const { data: profiles } = await service
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', actorIds)

    for (const p of profiles ?? []) {
      actorMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url }
    }
  }

  return rows.map((n) => mapNotification(n, actorMap))
}

export async function getUnreadCount(): Promise<number> {
  const { user } = await requireSession()
  const client = await createClient()

  const { count, error } = await client
    .from('notifications' as never)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
    .eq('is_dismissed', false)

  if (error) throw new SupabaseError(error.message)
  return count ?? 0
}

export async function markAsRead(id: string): Promise<void> {
  const { user } = await requireSession()
  const client = await createClient()

  const { error } = await client
    .from('notifications' as never)
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    } as never)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new SupabaseError(error.message)
}

export async function markAllAsRead(): Promise<void> {
  const { user } = await requireSession()
  const client = await createClient()

  const { error } = await client
    .from('notifications' as never)
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    } as never)
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) throw new SupabaseError(error.message)
}

export async function dismissNotification(id: string): Promise<void> {
  const { user } = await requireSession()
  const client = await createClient()

  const { error } = await client
    .from('notifications' as never)
    .update({ is_dismissed: true } as never)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new SupabaseError(error.message)
}

export async function dismissAll(): Promise<void> {
  const { user } = await requireSession()
  const client = await createClient()

  const { error } = await client
    .from('notifications' as never)
    .update({ is_dismissed: true } as never)
    .eq('user_id', user.id)
    .eq('is_read', true)

  if (error) throw new SupabaseError(error.message)
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  if (input.actor_id && input.actor_id === input.user_id) return

  const service = createServiceClient()

  const { error } = await service
    .from('notifications' as never)
    .insert(toInsertRow(input) as never)
    .select('id')
    .single()

  if (error) {
    console.error('[createNotification] failed:', error.message, input)
    return
  }

  void sendNotificationEmail(input).catch((err: unknown) => {
    console.error('[createNotification] email failed:', err)
  })
}

export async function createNotificationForMany(
  userIds: string[],
  input: Omit<CreateNotificationInput, 'user_id'>,
): Promise<void> {
  if (userIds.length === 0) return

  const recipients = input.actor_id
    ? userIds.filter((id) => id !== input.actor_id)
    : userIds

  if (recipients.length === 0) return

  const service = createServiceClient()

  const rows = recipients.map((user_id) =>
    toInsertRow({ ...input, user_id }),
  )

  const { error } = await service
    .from('notifications' as never)
    .insert(rows as never)

  if (error) {
    console.error('[createNotificationForMany] failed:', error.message)
    return
  }

  for (const user_id of recipients) {
    void sendNotificationEmail({ ...input, user_id }).catch((err: unknown) => {
      console.error(
        '[createNotificationForMany] email failed for',
        user_id,
        err,
      )
    })
  }
}
