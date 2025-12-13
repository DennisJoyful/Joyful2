// app/api/lead/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { contactByHandle } from '@/app/api/_contact/logic'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({} as any))
  const id = (body?.id ? String(body.id) : '').trim()
  const handle = (body?.handle ? String(body.handle) : '').trim()
  if (id) {
    const { contactById } = await import('@/app/api/_contact/logic')
    return contactById(req, id)
  }
  if (handle) return contactByHandle(req, handle)
  return NextResponse.json({ error: 'id or handle required' }, { status: 400 })
}
