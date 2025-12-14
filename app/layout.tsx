import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata = { title: 'TikTok Live Agency', description: 'AIO Management' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <div className="container">
          <header className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>TikTok Live Agency</h1>
              <NavBar />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
