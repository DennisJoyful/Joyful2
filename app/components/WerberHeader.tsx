'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function WerberHeader() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function logout() {
    setLoading(true)
    try {
      await fetch('/api/werber/logout', { method: 'POST' })
      router.push('/sws')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="text-sm text-gray-600">Werber-Dashboard</div>
      <button
        onClick={logout}
        disabled={loading}
        className="text-sm underline disabled:opacity-50"
      >
        {loading ? '…' : 'Logout'}
      </button>
    </div>
  )
}
