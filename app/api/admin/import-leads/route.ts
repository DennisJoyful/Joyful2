// app/api/admin/import-leads/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Multipart-Upload erwartet' }, { status: 400 });
    }
    const form = await req.formData();
    const managerId = String(form.get('manager_id') || '');
    const file = form.get('file') as File | null;
    if (!managerId || !file) return NextResponse.json({ error: 'manager_id und file erforderlich' }, { status: 400 });

    const text = await file.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let inserted = 0;
    for (const line of lines) {
      let handle = line;
      if (line.includes(',')) {
        handle = line.split(',')[0].trim();
      }
      handle = handle.replace(/^@/, '').trim();
      if (!handle) continue;
      const { error } = await supabase.from('leads').insert({
        manager_id: managerId,
        handle,
        source: 'admin_import',
        status: 'new'
      } as any);
      if (!error) inserted++;
    }
    return NextResponse.json({ ok: true, inserted });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'import failed' }, { status: 500 });
  }
}
