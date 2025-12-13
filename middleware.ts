import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
  // No auth redirect here; page-level guards handle access.
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };
