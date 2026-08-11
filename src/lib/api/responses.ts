import { NextResponse } from 'next/server'

export const ok = <T>(data: T) =>
  NextResponse.json({ data }, { status: 200 })

export const created = <T>(data: T) =>
  NextResponse.json({ data }, { status: 201 })

export const badRequest = (error: string) =>
  NextResponse.json({ error }, { status: 400 })

export const unauthorized = (error = 'Unauthorized') =>
  NextResponse.json({ error }, { status: 401 })

export const forbidden = (error = 'Forbidden') =>
  NextResponse.json({ error }, { status: 403 })

export const notFound = (error = 'Not found') =>
  NextResponse.json({ error }, { status: 404 })

export const conflict = (error: string) =>
  NextResponse.json({ error }, { status: 409 })

export const serverError = (error = 'Internal server error') =>
  NextResponse.json({ error }, { status: 500 })
