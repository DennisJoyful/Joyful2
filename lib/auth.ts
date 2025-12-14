/* lib/auth.ts
 * Minimal shim to prevent build errors. Returns null so pages render empty state.
 * TODO: Replace with your real session → manager-id resolver.
 */
export async function getSessionManagerId(): Promise<string | null> {
  return null
}
