import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

// This route looks up the manager by slug (not by code) to match the page param.
// Only the minimal change from .eq('code', ...) -> .eq('slug', ...) was made.
export async function GET(_: Request, { params }: { params: { managerSlug: string } }) {
  const admin = getAdminClient()
  const { data: manager, error } = await admin
    .from('managers')
    .select('*')
    .eq('slug', params.managerSlug) // ← important 1-line fix
    .single()

  if (error || !manager) {
    return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
  }

  return NextResponse.json({ manager })
}
