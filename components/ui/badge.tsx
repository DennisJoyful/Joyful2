/* components/ui/badge.tsx
 * Minimal Badge component (compatible API). Remove if you already have one.
 */
import * as React from "react"

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs">
      {children}
    </span>
  )
}
