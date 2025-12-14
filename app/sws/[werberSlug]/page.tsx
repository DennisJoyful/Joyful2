// app/sws/[werberSlug]/page.tsx
import FormHeader from '@/components/forms/FormHeader';
import SwsApplyForm from '@/components/forms/SwsApplyForm';
import { supabaseServer } from '@/lib/supabaseServer';

export default async function Page({ params }:{ params:{ werberSlug:string } }){
  const s = supabaseServer();
  const { data: w } = await s.from('werber').select('manager_id').eq('slug', params.werberSlug).single();
  const { data: m } = w ? await s.from('managers').select('slug, brand_color').eq('id', w.manager_id).single() : { data: null };

  const brand = m?.brand_color || '#111111';
  const managerSlug = m?.slug || '…';

  return (
    <main style={{ minHeight:'80vh', background: 'radial-gradient(1000px 400px at 20% 0%, rgba(124,58,237,.10), transparent), radial-gradient(1000px 400px at 80% 10%, rgba(37,99,235,.10), transparent)' }}>
      <div style={{ maxWidth: 760, margin: '2rem auto', borderRadius: 20, overflow:'hidden', boxShadow: '0 20px 40px rgba(0,0,0,.08)' }}>
        <FormHeader title="Joyful Agency – SWS Bewerbung" subtitle={`Werber: ${params.werberSlug} · Manager: ${managerSlug}`} brandColor={brand} />
        <SwsApplyForm werberSlug={params.werberSlug} />
      </div>
    </main>
  );
}
