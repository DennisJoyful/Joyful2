// app/thanks/page.tsx
export const metadata = { title: 'Danke – Joyful Agency' };
export default function Page(){
  return (
    <main style={{ display:'grid', placeItems:'center', minHeight:'60vh' }}>
      <div className="card" style={{ maxWidth:520 }}>
        <div className="card-body" style={{ display:'grid', gap:'.75rem' }}>
          <h2 style={{ fontWeight:700 }}>Vielen Dank!</h2>
          <p>Deine Angaben sind bei uns eingegangen. Wir melden uns zeitnah.</p>
          <a className="btn" href="/">Zurück zur Startseite</a>
        </div>
      </div>
    </main>
  );
}
