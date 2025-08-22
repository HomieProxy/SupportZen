import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    // The client API routes should not be protected by auth
    if (request.nextUrl.pathname.startsWith('/api/client')) {
        return NextResponse.next();
    }
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: '/:path*',
}
