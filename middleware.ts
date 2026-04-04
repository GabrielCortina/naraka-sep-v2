import { createServerClient } from '@supabase/ssr'
import { jwtVerify } from 'jose'
import { NextResponse, type NextRequest } from 'next/server'

// Inlined from role-config.ts (Edge Runtime may not resolve path aliases)
const ROLE_ROUTES: Record<string, string[]> = {
  admin: ['/dashboard', '/upload', '/fardos', '/prateleira', '/baixa'],
  lider: ['/dashboard', '/upload', '/fardos', '/prateleira'],
  separador: ['/prateleira'],
  fardista: ['/fardos', '/baixa'],
}

const ROLE_DEFAULTS: Record<string, string> = {
  admin: '/dashboard',
  lider: '/dashboard',
  separador: '/prateleira',
  fardista: '/fardos',
}

// Copy session cookies from supabaseResponse onto a redirect response
function redirectWithCookies(url: URL, supabaseResponse: NextResponse) {
  const redirect = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie.name, cookie.value)
  })
  return redirect
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — getUser() validates server-side and may refresh tokens
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Skip auth for public routes
  if (pathname === '/login' || pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // No authenticated user -> redirect to login with returnTo
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (pathname !== '/' && pathname !== '/login') {
      url.searchParams.set('returnTo', pathname)
    }
    return redirectWithCookies(url, supabaseResponse)
  }

  // Get session for JWT access token
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return redirectWithCookies(url, supabaseResponse)
  }

  // Verify JWT and extract role
  try {
    const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET!)
    const { payload } = await jwtVerify(session.access_token, secret)
    const userRole = payload.user_role as string | undefined

    if (!userRole) {
      // No role in token — force token refresh by signing out and back in
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('reason', 'missing_role')
      return redirectWithCookies(url, supabaseResponse)
    }

    // Root path -> redirect to role default
    if (pathname === '/') {
      return redirectWithCookies(
        new URL(ROLE_DEFAULTS[userRole] || '/dashboard', request.url),
        supabaseResponse
      )
    }

    // Check route permission
    const allowedRoutes = ROLE_ROUTES[userRole]
    if (allowedRoutes && !allowedRoutes.some(route => pathname.startsWith(route))) {
      return redirectWithCookies(
        new URL(ROLE_DEFAULTS[userRole] || '/login', request.url),
        supabaseResponse
      )
    }

    return supabaseResponse
  } catch {
    // JWT verification failed -> redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return redirectWithCookies(url, supabaseResponse)
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
