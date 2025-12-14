// app/apply/[managerSlug]/page.tsx
'use client'
import React from 'react'

export default function ManagerApplyPage({ params }: { params: { managerSlug: string } }){
  const { managerSlug } = params
  const [hydrated, setHydrated] = React.useState(false)
  React.useEffect(()=>{ setHydrated(true) }, [])

  return (
    <div className={"min-h-screen bg-white text-gray-900 " + (hydrated ? "" : "opacity-0")}>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <header className="space-y-1">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="h-10 w-auto max-w-[160px]" />
            <div>
              <h1 className="text-2xl font-semibold">Bewerbungsformular</h1>
              <div className="text-sm text-gray-600">Manager: <span className="font-medium">{managerSlug}</span></div>
            </div>
          </div>
        </header>
        <div className="p-6 rounded-2xl border bg-gray-50">
          <p>Hier kommt das Manager-Formular für <span className="font-medium">{managerSlug}</span>.</p>
        </div>
      </div>
    </div>
  )
}
