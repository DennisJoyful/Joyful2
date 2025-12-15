// app/dashboard/manager/leads/layout.tsx

export default function LeadsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4">
      {children}
    </div>
  )
}
