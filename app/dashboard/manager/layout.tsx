// app/dashboard/manager/layout.tsx
import type { ReactNode } from 'react'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
    </>
  )
}