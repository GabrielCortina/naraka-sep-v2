import { createServerClient } from '@supabase/ssr'
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

  // getUser() validates JWT server-side with Supabase (handles ES256/HS256 internally)
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

  // Extract role: try JWT claim first, fall back to database lookup
  let userRole: string | undefined

  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    try {
      const parts = session.access_token.split('.')
      const payload = JSON.parse(atob(parts[1]))
      userRole = payload.user_role
    } catch {
      // JWT decode failed — will fall back to DB
    }
  }

  // Fallback: query role from database if hook didn't inject it
  if (!userRole) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = userData?.role
  }

  if (!userRole) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('reason', 'no_role')
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
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
