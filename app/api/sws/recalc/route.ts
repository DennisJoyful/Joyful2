import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export async function POST(){
  const s = createServerComponentClient({ cookies });
  const { data: rules } = await s.from('sws_rules').select('*').eq('active', true);
  const getRule = (code: string) => rules?.find(r => r.code === code);

  const { data: joined } = await s.from('leads').select('creator_id, werber_id, status').eq('status','joined');
  const referrals = new Map((joined||[]).map(j => [j.creator_id as any, j.werber_id]));

  const { data: streamers } = await s.from('streamer').select('creator_id, join_date');
  let created = 0;

  if (streamers) for (const st of streamers) {
    if (!st.join_date) continue;
    const join = new Date(st.join_date as any);
    const firstFull = new Date(join.getFullYear(), join.getMonth()+1, 1);
    const threeMonthsEnd = new Date(firstFull.getFullYear(), firstFull.getMonth()+3, 1);

    const { data: stats } = await s
      .from('stream_stats')
      .select('*')
      .eq('creator_id', st.creator_id)
      .gte('period_month', firstFull.toISOString().slice(0,10))
      .lt('period_month', threeMonthsEnd.toISOString().slice(0,10))
      .order('period_month');

    const werber_id = referrals.get(st.creator_id as any);
    if (!werber_id) continue;
    if (!stats || stats.length === 0) continue;

    const first = stats.find(x => new Date(x.period_month as any).getTime() === firstFull.getTime());
    if (first && first.days_streamed >= 7 && Number(first.hours_streamed) >= 15 && getRule('ACTIVE_7_15_FIRST_FULL')) {
      await s.from('sws_events').insert({ werber_id, creator_id: st.creator_id, rule_code: 'ACTIVE_7_15_FIRST_FULL', period_month: firstFull.toISOString().slice(0,10), points: getRule('ACTIVE_7_15_FIRST_FULL')!.points });
      created++;
    }

    if (stats.length >= 3 && stats.slice(0,3).every(x => x.days_streamed >= 7 && Number(x.hours_streamed) >= 15) && getRule('ACTIVE_7_15_3_CONSEC')) {
      await s.from('sws_events').insert({ werber_id, creator_id: st.creator_id, rule_code: 'ACTIVE_7_15_3_CONSEC', period_month: firstFull.toISOString().slice(0,10), points: getRule('ACTIVE_7_15_3_CONSEC')!.points });
      created++;
    }

    const totalDiamonds = stats.slice(0,3).reduce((a,b)=>a + Number((b as any).diamonds || 0), 0);
    if (totalDiamonds >= 15000 && getRule('DIAMONDS_15K_3M')) {
      await s.from('sws_events').insert({ werber_id, creator_id: st.creator_id, rule_code: 'DIAMONDS_15K_3M', period_month: firstFull.toISOString().slice(0,10), points: getRule('DIAMONDS_15K_3M')!.points });
      created++;
    }
    if (totalDiamonds >= 50000 && getRule('DIAMONDS_50K_3M')) {
      await s.from('sws_events').insert({ werber_id, creator_id: st.creator_id, rule_code: 'DIAMONDS_50K_3M', period_month: firstFull.toISOString().slice(0,10), points: getRule('DIAMONDS_50K_3M')!.points });
      created++;
    }

    if (getRule('ROOKIE_150K_MONTH')) {
      const monthHit = stats.find(x => Number((x as any).diamonds) >= 150000);
      if (monthHit) {
        await s.from('sws_events').insert({ werber_id, creator_id: st.creator_id, rule_code: 'ROOKIE_150K_MONTH', period_month: (monthHit as any).period_month, points: getRule('ROOKIE_150K_MONTH')!.points });
        created++;
      }
    }
  }

  return NextResponse.json({ ok: true, created });
}
