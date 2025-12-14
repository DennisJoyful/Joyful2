// app/apply/layout.tsx
import type { ReactNode } from 'react'
import Script from 'next/script'
import './apply.css'

export const metadata = {
  title: 'Bewerbung',
}

export default function ApplyLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className="apply-root">
      <head>
        <Script id="apply-hydrated-flag" strategy="beforeInteractive">
          {`document.documentElement.classList.add('hydrated')`}
        </Script>
      </head>
      <body className="apply-route">
        <div className="fouc-guard">
          {children}
        </div>
      </body>
    </html>
  )
}
