// app/dashboard/manager/ManagerLiveEnhancer.tsx
'use client'
import { useEffect } from 'react'

async function checkLive(handle: string): Promise<'live' | 'offline' | 'unknown'> {
  try {
    const res = await fetch(`/api/livecheck?handle=${encodeURIComponent(handle)}`, { cache: 'no-store' })
    const json = await res.json()
    if (typeof json?.live === 'boolean') return json.live ? 'live' : 'offline'
    if (json?.status === 'live' || json?.status === 'offline') return json.status
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

function ensureBadgeCell(tr: HTMLTableRowElement, idx: number): HTMLTableCellElement {
  const cells = Array.from(tr.children) as HTMLElement[]
  const existing = cells[idx + 1] as HTMLTableCellElement | undefined
  if (existing && existing.dataset && existing.dataset['liveBadgeCell'] === '1') return existing
  const td = document.createElement('td')
  td.dataset['liveBadgeCell'] = '1'
  td.className = (cells[idx] as HTMLElement)?.className || 'px-3 py-2'
  tr.insertBefore(td, cells[idx + 1] || null)
  return td
}

function renderBadgeInto(td: HTMLTableCellElement, state: 'live' | 'offline' | 'unknown') {
  td.innerHTML = ''
  const span = document.createElement('span')
  span.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white'
  span.style.whiteSpace = 'nowrap'
  span.style.userSelect = 'none'
  span.style.display = 'inline-flex'
  span.style.alignItems = 'center'
  span.style.gap = '0.25rem'
  const dot = document.createElement('span')
  dot.style.width = '0.5rem'
  dot.style.height = '0.5rem'
  dot.style.borderRadius = '9999px'
  dot.style.background = 'rgba(255,255,255,0.9)'
  span.appendChild(dot)
  let bg = '#f59e0b' // unknown
  let label = 'unbekannt'
  if (state === 'live') { bg = '#22c55e'; label = 'LIVE' }
  if (state === 'offline') { bg = '#9ca3af'; label = 'offline' }
  span.style.background = bg
  span.appendChild(document.createTextNode(label))
  td.appendChild(span)
}

export default function ManagerLiveEnhancer() {
  useEffect(() => {
    const table = document.querySelector('table')
    if (!table) return

    const ths = Array.from(table.querySelectorAll('thead th, thead td')) as HTMLElement[]
    const handleIdx = ths.findIndex(th => /handle/i.test(th.textContent || ''))
    if (handleIdx === -1) return

    const alreadyHasLive = ths.some(th => /\blive\b/i.test(th.textContent || ''))
    if (!alreadyHasLive) {
      const liveTH = document.createElement('th')
      liveTH.textContent = 'Live'
      liveTH.className = ths[handleIdx].className || 'px-3 py-2 text-left'
      const headerRow = ths[0]?.closest('tr')
      if (headerRow) headerRow.insertBefore(liveTH, ths[handleIdx].nextSibling)
    }

    async function updateAll() {
      const tbl = document.querySelector('table') as HTMLTableElement | null
      if (!tbl) return
      const rows = Array.from(tbl.querySelectorAll('tbody tr')) as HTMLTableRowElement[]
      for (const tr of rows) {
        const cells = Array.from(tr.children) as HTMLElement[]
        if (cells.length <= handleIdx) continue
        const handleText = (cells[handleIdx].textContent || '').trim().replace(/^@/, '')
        if (!handleText) continue
        const td = ensureBadgeCell(tr, handleIdx)
        const state = await checkLive(handleText)
        renderBadgeInto(td, state)
      }
    }

    let timer: any
    updateAll()
    timer = setInterval(updateAll, 15000) // refresh every 15s
    return () => { if (timer) clearInterval(timer) }
  }, [])

  return null
}