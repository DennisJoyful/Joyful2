// app/auth/sign-in/page.tsx
import { Suspense } from 'react';
import SignInForm from '@/components/auth/SignInForm';

export default function Page() {
  return (
    <main className="card">
      <div className="card-body">
        <h2 style={{ fontWeight: 600, marginBottom: '.5rem' }}>Login</h2>
        <Suspense fallback={<div>Lade…</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  );
}
