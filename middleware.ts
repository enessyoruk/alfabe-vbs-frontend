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

  // Statik/next dosyaları, api ve kök sayfa → middleware devre dışı
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/"
  ) {
    return NextResponse.next()
  }

  // Korunan rota mı?
  const rule = PROTECTED.find((r) => pathname.startsWith(r.prefix))
  if (!rule) return NextResponse.next()

  // Oturum çerezi (HttpOnly JWT)
  const token = req.cookies.get("vbs_session")?.value
  if (!token) {
    const url = new URL("/login", req.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  try {
    const payload = await verify(token)

    // 1) JWT içindeki roller
    let roles: string[] = []
    if (Array.isArray(payload.roles)) {
      roles = payload.roles
    } else if (typeof payload.roles === "string" && payload.roles.trim()) {
      roles = [payload.roles]
    }

    // 2) Ek güvenli fallback: vbs_role çerezi (login sırasında biz yazıyoruz)
    const cookieRole = req.cookies.get("vbs_role")?.value
    if (cookieRole && !roles.includes(cookieRole)) {
      roles.push(cookieRole)
    }

    // 3) Hedef rota için gereken rol var mı?
    if (!roles.includes(rule.need)) {
      const url = new URL("/login", req.url)
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch {
    const url = new URL("/login", req.url)
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }
}

// Eski geniş matcher (login, diğer sayfalar bozulmuyordu)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
}
