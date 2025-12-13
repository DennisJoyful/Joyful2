'use client';

import LeadsFetcher from '@/components/leads/LeadsFetcher';

export const revalidate = 0; // never cache
export const dynamic = 'force-dynamic';

export default function LeadsPage() {
  return <LeadsFetcher />;
}
