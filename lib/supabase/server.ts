/* lib/supabase/server.ts
 * Minimal shim to prevent build errors. Returns a very small client-like API.
 * TODO: Replace with your real Supabase server client helper.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAdminClient(): any {
  const chain = {
    select() { return chain },
    eq() { return chain },
    is() { return chain },
    order() { return { data: [], error: null } },
  }
  return {
    from() { return chain }
  }
}
