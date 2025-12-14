// app/sws/[werberSlug]/page.tsx
import React from 'react'

export default function SWSApplyPage({ params }: { params: { werberSlug: string } }){
  const { werberSlug } = params
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Bewerbungsformular</h1>
          <div className="text-sm text-gray-600">
            Werber: <span className="font-medium">{werberSlug}</span>
          </div>
        </header>
        <div className="p-6 rounded-2xl border bg-gray-50">
          <p>Hier kommt das SWS Formular für <span className="font-medium">{werberSlug}</span>.</p>
        </div>
      </div>
    </div>
  )
}
