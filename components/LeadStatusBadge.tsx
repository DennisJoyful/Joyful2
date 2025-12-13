// components/LeadStatusBadge.tsx
export default function LeadStatusBadge({ status }: { status: string }){
  const map: Record<string, {label:string, bg:string}> = {
    no_response: { label: 'keine Reaktion', bg: '#fee2e2' },
    invited: { label: 'eingeladen', bg: '#dbeafe' },
    declined: { label: 'abgesagt', bg: '#ede9fe' },
    joined: { label: 'gejoint', bg: '#dcfce7' },
  };
  const cfg = map[status] || { label: status, bg: '#f3f4f6' };
  return <span style={{ background: cfg.bg, padding: '.15rem .5rem', borderRadius: 999, fontSize: 12 }}>{cfg.label}</span>;
}
