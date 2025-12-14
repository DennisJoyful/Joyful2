// app/apply/[managerSlug]/page.tsx
import FormHeader from '@/components/forms/FormHeader'
import ManagerApplyForm from '@/components/forms/ManagerApplyForm'
import { supabaseServer } from '@/lib/supabaseServer'

export default async function Page({ params }:{ params:{ managerSlug:string } }){
  const s = supabaseServer();
  const { data: m } = await s.from('managers').select('slug, brand_color').eq('slug', params.managerSlug).single();
  const brand = m?.brand_color || '#111111';
  const managerSlug = m?.slug || params.managerSlug;

  return (
    <main style={{ minHeight:'80vh', background: 'radial-gradient(1000px 400px at 80% 10%, rgba(37,99,235,.10), transparent)' }}>
      <div style={{ maxWidth: 760, margin: '2rem auto', borderRadius: 16, background: '#fff', overflow:'hidden', boxShadow: '0 20px 40px rgba(0,0,0,.08)' }}>
        <FormHeader title="Joyful Agency – Manager Bewerbung" subtitle={`Manager: ${managerSlug}`} brandColor={brand} />
        <ManagerApplyForm managerSlug={managerSlug} />
      </div>
    </main>
  );
}
