// app/auth/werber/page.tsx
import { redirect } from 'next/navigation';

export default function Page(){
  // Ab jetzt nur ein gemeinsames Login-Formular auf /auth/sign-in
  redirect('/auth/sign-in');
}
