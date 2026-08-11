import { NextResponse } from 'next/server'

// Placeholder — implement in Leads feature phase
export async function GET() {
  return NextResponse.json({ data: [] })
}

export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
