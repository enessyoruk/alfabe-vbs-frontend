// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const PROTECTED = [
  { prefix: "/parent/", need: "Parent" },
  { prefix: "/teacher/", need: "Teacher" },
]

type SessionPayload = {
  roles?: string[] | string
  sub?: string
  email?: string
  name?: string
}

async function verify(token: string): Promise<SessionPayload> {
  const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "")
  const { payload } = await jwtVerify(token, secret)
  return payload as SessionPayload
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Static and API — no auth, but CSP override MUST apply
  const res = NextResponse.next()

  // 🔥 ZORUNLU CSP OVERRIDE — BEYAZ EKRANI KALDIRAN KOD
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https: blob:",
      "style-src 'self' 'unsafe-inline' https:",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "frame-src 'self' https://www.google.com https://maps.google.com https://www.google.com.tr",
      "connect-src 'self' https://* http://*",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  )

  // Özel durumlar: API, statik dosyalar → auth kontrolü yok
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/login" ||
    pathname === "/"
  ) {
    return res
  }

  // Protected route kontrolü
  const rule = PROTECTED.find((r) => pathname.startsWith(r.prefix))
  if (!rule) return res

  const token = req.cookies.get("vbs_session")?.value
  if (!token) {
    const url = new URL("/login", req.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  try {
    const payload = await verify(token)

    let roles: string[] = []
    if (Array.isArray(payload.roles)) roles = payload.roles
    else if (typeof payload.roles === "string") roles = [payload.roles]

    const cookieRole = req.cookies.get("vbs_role")?.value
    if (cookieRole && !roles.includes(cookieRole)) roles.push(cookieRole)

    if (!roles.includes(rule.need)) {
      const url = new URL("/login", req.url)
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }

    return res
  } catch {
    const url = new URL("/login", req.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: "/:path*",
}
