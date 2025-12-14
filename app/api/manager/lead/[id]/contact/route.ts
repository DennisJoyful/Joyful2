// app/api/manager/lead/[id]/contact/route.ts
import { NextRequest } from 'next/server'
import { contactById } from '@/app/api/_contact/logic'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return contactById(req, params.id)
}
