// app/api/manager/leads/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { contactByHandle } from '@/app/api/_contact/logic'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({} as any))
  const handle = (body?.handle ? String(body.handle) : '').trim()
  if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 })
  return contactByHandle(req, handle)
}
