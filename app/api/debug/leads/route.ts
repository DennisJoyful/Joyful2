// app/api/debug/leads/route.ts
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = getAdminClient()

    // fetch one row to infer columns
    const one = await supabase.from('leads').select('*').limit(1)
    if (one.error) {
      return NextResponse.json({ ok: false, step: 'select_one', message: one.error.message }, { status: 500 })
    }
    const cols = one.data?.length ? Object.keys(one.data[0]) : []

    // fetch 20 rows (no filters) to see what's there
    const many = await supabase.from('leads').select('*').limit(20)
    if (many.error) {
      return NextResponse.json({ ok: false, step: 'select_many', message: many.error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      columns: cols,
      sample: many.data
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message ?? 'unknown error' }, { status: 500 })
  }
}