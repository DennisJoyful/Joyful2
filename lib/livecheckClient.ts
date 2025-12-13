// lib/livecheckClient.ts
export type LiveProbe = { live: boolean|null, reason?: string }

export async function fetchLiveStatus(handle: string, signal?: AbortSignal, timeoutMs = 8000): Promise<LiveProbe> {
  const h = handle.replace(/^@+/, '').trim()
  if (!h) return { live: null, reason: 'invalid-handle' }
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`/api/livecheck-webcast?handle=${encodeURIComponent(h)}`, {
      method: 'GET',
      signal: signal ?? ctrl.signal,
      cache: 'no-store',
      headers: { 'accept': 'application/json' }
    })
    if (!res.ok) return { live: null, reason: `http:${res.status}` }
    const data = await res.json()
    const live = typeof data?.live === 'boolean' ? data.live : null
    return { live, reason: data?.reason || null }
  } catch (e:any) {
    if (e?.name === 'AbortError') return { live: null, reason: 'timeout' }
    return { live: null, reason: 'fetch-error' }
  } finally {
    clearTimeout(t)
  }
}
