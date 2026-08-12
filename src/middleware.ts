import { type NextRequest, NextResponse } from 'next/server'

// ⚠️  UI TESTING MODE — auth gate disabled
// TODO: restore full middleware when auth is wired
// Replace this entire file with CURSOR_AUTH_PROMPT.md middleware
// when ready to wire Supabase auth.

export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
