import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST() {
  cookies().set('werber_id', '', { path: '/', maxAge: 0 })
  return NextResponse.json({ status: 'ok' })
}
