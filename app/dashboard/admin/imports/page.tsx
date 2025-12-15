'use client'
import { useState } from 'react'

export default function AdminImports() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/imports/upload', {
        method: 'POST',
        body: fd
      })
      const json = await res.json()
      if (!res.ok && res.status !== 207) throw new Error(json?.error || 'Import fehlgeschlagen')
      setResult(json)
    } catch (e:any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold mb-4">Monatsdaten importieren</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-4">
        <div>
          <label className="block text-sm font-medium mb-1">TikTok Excel (Monatsbasis)</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e)=>setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Der Import erkennt die Kopfzeile automatisch und mappt die SWS-relevanten Spalten.
          </p>
        </div>
        <button
          type="submit"
          disabled={!file || loading}
          className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-50"
        >
          {loading ? 'Importiere…' : 'Import starten'}
        </button>
      </form>

      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
      {result && (
        <pre className="mt-4 text-sm bg-gray-50 border rounded-xl p-3 overflow-auto">
{JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
