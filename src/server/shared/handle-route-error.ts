import { NextResponse } from 'next/server'
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  SupabaseError,
} from './errors'

export function handleRouteError(error: unknown): NextResponse {
  console.error('[Route Error]', error)

  if (error instanceof UnauthorizedError)
    return NextResponse.json({ error: error.message }, { status: 401 })
  if (error instanceof ForbiddenError)
    return NextResponse.json({ error: error.message }, { status: 403 })
  if (error instanceof NotFoundError)
    return NextResponse.json({ error: error.message }, { status: 404 })
  if (error instanceof ValidationError)
    return NextResponse.json({ error: error.message }, { status: 400 })
  if (error instanceof SupabaseError)
    return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
