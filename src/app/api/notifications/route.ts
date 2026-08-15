import { ok } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  dismissAll,
} from '@/server/notifications/notifications.server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'unread_count') {
      const count = await getUnreadCount()
      return ok({ count })
    }

    const unread_only = searchParams.get('unread_only') === 'true'
    const limit = parseInt(searchParams.get('limit') ?? '50', 10)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)

    const data = await getNotifications({ unread_only, limit, offset })
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const id = searchParams.get('id')

    if (action === 'mark_all_read') {
      await markAllAsRead()
      return ok({ success: true })
    }

    if (action === 'dismiss_all') {
      await dismissAll()
      return ok({ success: true })
    }

    if (!id) return ok({ success: false })

    if (action === 'dismiss') {
      await dismissNotification(id)
    } else {
      await markAsRead(id)
    }

    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
