'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SWSIndex() {
  const [slug, setSlug] = useState('')
  const router = useRouter()
  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-semibold mb-2">SWS Login</h1>
      <p className="text-sm text-gray-600 mb-4">Gib deinen Werber-Slug ein, um zum PIN-Login zu gelangen.</p>
      <div className="space-y-2 rounded-2xl border p-4">
        <input
          value={slug}
          onChange={(e)=>setSlug(e.target.value)}
          placeholder="werber-slug"
          className="w-full border rounded-lg px-3 py-2 text-sm"
        />
        <button
          onClick={()=> slug && router.push(`/sws/${slug.trim().toLowerCase()}`)}
          disabled={!slug}
          className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50 w-full"
        >
          Weiter
        </button>
      </div>
    </div>
  )
}
