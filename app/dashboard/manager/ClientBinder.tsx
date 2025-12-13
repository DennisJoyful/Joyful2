// app/dashboard/manager/ClientBinder.tsx
'use client'
import { useEffect } from 'react'

type CacheEntry = { value: boolean | null, expires: number, inflight?: Promise<boolean | null> }
const liveCache: Record<string, CacheEntry> = {}

async function fetchLive(handle: string): Promise<boolean | null> {
  const key = handle.toLowerCase()
  const now = Date.now()
  const entry = liveCache[key]
  if (entry && entry.expires > now && !entry.inflight) return entry.value
  const doFetch = async (): Promise<boolean | null> => {
    try {
      // Prefer connector-only for accuracy
      const r2 = await fetch(`/api/livecheck-ws-only?handle=${encodeURIComponent(handle)}`, { cache: 'no-store' })
      const d2 = await r2.json().catch(()=>({}))
      if (typeof d2?.live === 'boolean') return d2.live
      // Fallback to mixed checker
      const r1 = await fetch(`/api/livecheck?handle=${encodeURIComponent(handle)}`, { cache: 'no-store' })
      const d1 = await r1.json().catch(()=>({}))
      if (typeof d1?.live === 'boolean') return d1.live
      return null
    } catch { return null }
  }
  const p = doFetch().then(v => {
    liveCache[key] = { value: v, expires: Date.now() + 60_000 }
    return v
  }).finally(() => { if (liveCache[key]) delete liveCache[key].inflight })
  liveCache[key] = { value: entry?.value ?? null, expires: now + 5_000, inflight: p }
  return p
}

function debounce(fn: () => void, ms: number) {
  let t: any
  return () => { clearTimeout(t); t = setTimeout(fn, ms) }
}

function isHeaderOrFooter(el: Element | null): boolean {
  if (!el) return false
  return !!el.closest('thead, tfoot')
}

function findRows(): HTMLElement[] {
  const rows: HTMLElement[] = []
  document.querySelectorAll<HTMLElement>('tbody tr, li.lead-row, [role="row"]').forEach(el => {
    if ((el as any)._leadBound) return
    if (isHeaderOrFooter(el)) return
    const text = (el.textContent || '').trim()
    const hasHandleText = /@([A-Za-z0-9_\.]{3,30})/.test(text)
    const hasLink = !!el.querySelector('a[href*="tiktok.com/@"]')
    const hasId = el.hasAttribute('data-lead-id') || !!el.querySelector('[data-lead-id]')
    if (hasId || hasLink || hasHandleText) rows.push(el)
  })
  return rows.slice(0, 300) // safety guard
}

function extractHandle(row: HTMLElement): string | null {
  const hEl = row.querySelector('[data-lead-handle]') as HTMLElement | null
  if (hEl?.getAttribute('data-lead-handle')) return hEl.getAttribute('data-lead-handle')!.replace(/^@+/, '')
  const a = row.querySelector('a[href*="tiktok.com/@"]') as HTMLAnchorElement | null
  if (a?.href) {
    const m = a.href.match(/tiktok\.com\/@([A-Za-z0-9_\.]{3,30})/i)
    if (m) return m[1]
  }
  const txt = (row.textContent || '').trim()
  const m = txt.match(/@([A-Za-z0-9_\.]{3,30})/)
  if (m) return m[1]
  return null
}

function isoDatePlus(days=0) {
  const d = new Date()
  d.setDate(d.getDate()+days)
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

async function mountForRow(row: HTMLElement) {
  if ((row as any)._leadBound) return
  ;(row as any)._leadBound = true

  // Live badge
  const handle = extractHandle(row)
  if (handle) {
    let badge = row.querySelector('[data-live-badge]') as HTMLElement | null
    if (!badge) {
      badge = document.createElement('span')
      badge.setAttribute('data-live-badge','1')
      badge.className = 'ml-2 text-xs px-2 py-0.5 rounded border'
      badge.textContent = '…'
      row.appendChild(badge)
    }
    const update = async () => {
      const live = await fetchLive(handle)
      if (live === true) {
        badge!.textContent = 'LIVE'
        badge!.className = 'ml-2 text-xs px-2 py-0.5 rounded border bg-green-50 border-green-400 text-green-700'
      } else if (live === false) {
        badge!.textContent = 'offline'
        badge!.className = 'ml-2 text-xs px-2 py-0.5 rounded border bg-gray-50 border-gray-300 text-gray-600'
      } else {
        badge!.textContent = '…'
        badge!.className = 'ml-2 text-xs px-2 py-0.5 rounded border'
      }
    }
    update()
    ;(row as any)._liveTimer = setInterval(update, 60_000)
  }

  // "Kontakt gesetzt" button handler (robust)
  row.addEventListener('click', async (ev) => {
    const t = ev.target as HTMLElement
    const btn = t?.closest('button, a') as HTMLElement | null
    if (!btn) return
    const label = (btn.textContent || '').toLowerCase()
    if (!label.includes('kontakt gesetzt') && !btn.getAttribute('data-action')?.includes('contact')) return

    ev.preventDefault()
    const idEl = row.getAttribute('data-lead-id') ? row : (row.querySelector('[data-lead-id]') as HTMLElement | null)
    const id = idEl?.getAttribute('data-lead-id') || ''
    const handle2 = handle || extractHandle(row)

    const paths = [
      id ? `/api/manager/leads/${id}/contact` : '',
      id ? `/api/manager/lead/${id}/contact` : '',
      `/api/manager/leads/contact`,
      `/api/manager/lead/contact`,
      `/api/leads/contact`,
      `/api/lead/contact`,
    ].filter(Boolean)

    for (const p of paths) {
      const r = await fetch(p, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(id ? {} : { handle: handle2 })
      })
      if (r.ok) {
        // inline update
        const c = row.querySelector('[data-contact-date]') as HTMLElement | null
        const f = row.querySelector('[data-follow-up]') as HTMLElement | null
        if (c) c.textContent = isoDatePlus(0)
        if (f) f.textContent = isoDatePlus(5)
        // follow-up-sent toggle
        if (id && !row.querySelector('[data-followup-sent-control]')) {
          const wrap = document.createElement('label')
          wrap.setAttribute('data-followup-sent-control','1')
          wrap.className = 'ml-2 inline-flex items-center gap-1 text-xs'
          const cb = document.createElement('input')
          cb.type = 'checkbox'
          cb.addEventListener('change', async () => {
            const rr = await fetch(`/api/manager/leads/${id}/followup-sent`, {
              method: 'POST', headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ sent: cb.checked })
            })
            if (!rr.ok) alert('Follow-up-Status konnte nicht gespeichert werden.')
          })
          const span = document.createElement('span')
          span.textContent = 'Follow-up gesendet'
          wrap.appendChild(cb); wrap.appendChild(span)
          ;(f || row).appendChild(wrap)
        }
        return
      }
    }
    alert('Kontakt-Fehler. Bitte kurz neu laden oder erneut versuchen.')
  }, { passive: false })
}

function hideLiveColumnLight() {
  const head = document.querySelector('thead')
  if (!head) return
  head.querySelectorAll('th').forEach((th, idx) => {
    const txt = (th.textContent || '').trim().toLowerCase()
    if (txt === 'live') {
      (th as HTMLElement).style.display = 'none'
      document.querySelectorAll('tbody tr').forEach(tr => {
        const tds = tr.querySelectorAll('td')
        if (tds[idx]) (tds[idx] as HTMLElement).style.display = 'none'
      })
    }
  })
}

export default function ClientBinder() {
  useEffect(() => {
    hideLiveColumnLight()
    const debouncedScan = debounce(() => {
      hideLiveColumnLight()
      const rows = findRows()
      rows.forEach(r => mountForRow(r))
    }, 200)

    const mo = new MutationObserver(debouncedScan)
    mo.observe(document.body, { childList: true, subtree: true })
    debouncedScan()

    return () => { mo.disconnect() }
  }, [])

  return null
}
