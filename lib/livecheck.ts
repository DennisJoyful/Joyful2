// lib/livecheck.ts
export type LiveCheckResult = { handle: string; live: boolean | null; status?: number; url: string; reason?: string | string[] }

type FetchVariant = { url: string, headers: Record<string,string>, tag: string }

const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
const MOBILE  = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'

function variantsFor(handle: string): FetchVariant[] {
  const base = `https://www.tiktok.com/@${handle}`
  const common = {
    'accept-language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'upgrade-insecure-requests': '1',
  }
  return [
    { url: base + '/live', headers: { ...common, 'user-agent': DESKTOP }, tag: 'desktop:/live' },
    { url: base,           headers: { ...common, 'user-agent': DESKTOP }, tag: 'desktop:profile' },
    { url: base + '/live', headers: { ...common, 'user-agent': MOBILE  }, tag: 'mobile:/live' },
    { url: base,           headers: { ...common, 'user-agent': MOBILE  }, tag: 'mobile:profile' },
  ]
}

function extractSIGI(html: string): any | null {
  const m = html.match(/<script[^>]+id=["']SIGI_STATE["'][^>]*>([\s\S]*?)<\/script>/i)
  if (!m) return null
  try { return JSON.parse(m[1].trim()) } catch { return null }
}

function deepYes(obj: any): string | null {
  const stack = [obj]
  while (stack.length) {
    const cur = stack.pop()
    if (cur && typeof cur === 'object') {
      for (const [k, v] of Object.entries(cur)) {
        const key = k.toLowerCase()
        if (['islive','islivenow','is_living'].includes(key) && (v === true || v === 1)) return key + ':true'
        if (['livestatus','roomstatus','status'].includes(key) && Number(v) === 1) return key + ':1'
        if (v && typeof v === 'object') stack.push(v)
      }
    }
  }
  return null
}

function deepNo(obj: any): string | null {
  const stack = [obj]
  while (stack.length) {
    const cur = stack.pop()
    if (cur && typeof cur === 'object') {
      for (const [k, v] of Object.entries(cur)) {
        const key = k.toLowerCase()
        if (['islive','islivenow','is_living'].includes(key) && (v === false || v === 0)) return key + ':false'
        if (['livestatus','roomstatus','status'].includes(key) && Number(v) === 0) return key + ':0'
        if (v && typeof v === 'object') stack.push(v)
      }
    }
  }
  return null
}

function hasOgVideo(html: string): boolean {
  return /<meta[^>]+property=["']og:video["'][^>]*>/i.test(html) || /<meta[^>]+property=["']og:video:secure_url["'][^>]*>/i.test(html)
}
function hasStreamUrl(html: string): boolean {
  return /(https?:\/\/[^"']+\.(m3u8|mpd))/i.test(html)
}

export async function detectTikTokLive(handleRaw: string): Promise<LiveCheckResult> {
  const handle = handleRaw.replace(/^@+/, '')
  const tries = variantsFor(handle)
  const reasons: string[] = []
  let any200 = false
  for (const v of tries) {
    try {
      const res = await fetch(v.url, { method: 'GET', headers: v.headers, cache: 'no-store', redirect: 'manual' })
      if ([301,302,303,307,308].includes(res.status)) { reasons.push(`${v.tag}:redirect`); continue }
      if (res.status !== 200) { reasons.push(`${v.tag}:status${res.status}`); continue }
      any200 = true
      const html = await res.text()
      const sigi = extractSIGI(html)
      if (sigi) {
        const yes = deepYes(sigi)
        const no = deepNo(sigi)
        if (yes) return { handle, live: true, status: 200, url: v.url, reason: reasons.concat(`SIGI:${yes} @ ${v.tag}`) }
        if (no)  { reasons.push(`SIGI:${no} @ ${v.tag}`); continue }
        reasons.push(`SIGI:none @ ${v.tag}`)
        // keep looping other variants
      } else {
        // Fallback: require BOTH og:video AND stream url to call it live
        const og = hasOgVideo(html)
        const su = hasStreamUrl(html)
        if (og && su) return { handle, live: true, status: 200, url: v.url, reason: reasons.concat(`fallback:og+stream @ ${v.tag}`) }
        reasons.push(`fallback:${og?'og':''}${su?'+stream':''} @ ${v.tag}`)
      }
    } catch (e:any) {
      reasons.push(`${v.tag}:error:${String(e?.message || e)}`)
    }
  }
  if (!any200) return { handle, live: null, url: tries[0].url, reason: reasons }
  // if we saw explicit SIGI false in any fetch, treat as offline
  const sawNo = reasons.some(r => /SIGI:.*:(false|0)/i.test(r))
  if (sawNo) return { handle, live: false, url: tries[0].url, reason: reasons }
  // conservative default: offline
  return { handle, live: false, url: tries[0].url, reason: reasons }
}
