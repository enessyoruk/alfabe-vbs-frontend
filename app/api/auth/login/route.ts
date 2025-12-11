import { NextRequest, NextResponse } from "next/server"
import { SignJWT, jwtVerify, type JWTPayload } from "jose"

export const runtime = "nodejs"

// ======================================================
// ENV HELPERS
// ======================================================
function requiredEnv(name: string): string {
  const val = process.env[name]
  if (!val || !val.trim()) {
    throw new Error(`Missing env: ${name}`)
  }
  return val
}

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE || process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND_API_BASE) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

const SESSION_SECRET = requiredEnv("SESSION_SECRET")

// ======================================================
// HELPERS
// ======================================================
function isValidEmail(v: unknown) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function isValidPassword(v: unknown) {
  return typeof v === "string" && v.length >= 3 && v.length <= 128
}

async function signSession(payload: JWTPayload) {
  const secret = new TextEncoder().encode(SESSION_SECRET)
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret)
}

async function verifySession(token: string) {
  const secret = new TextEncoder().encode(SESSION_SECRET)
  return await jwtVerify(token, secret)
}

function isHttps(req: NextRequest) {
  return req.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production"
}

function buildSessionCookie(token: string, req: NextRequest) {
  return {
    name: "vbs_session",
    value: token,
    httpOnly: true,
    secure: isHttps(req),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  }
}

function setRoleCookie(resp: NextResponse, req: NextRequest, roles: string[]) {
  const role =
    roles.includes("Teacher") ? "Teacher" :
    roles.includes("Parent")  ? "Parent" : ""

  if (!role) return

  resp.cookies.set({
    name: "vbs_role",
    value: role,
    httpOnly: false,
    secure: isHttps(req),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  })

  resp.cookies.set({
    name: "vbs_auth",
    value: "1",
    httpOnly: false,
    secure: isHttps(req),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  })
}

function noStore(resp: NextResponse) {
  resp.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  resp.headers.set("Pragma", "no-cache")
  resp.headers.set("Expires", "0")
  return resp
}

function normalizeRoles(raw: any): string[] {
  if (Array.isArray(raw)) return raw.filter(r => typeof r === "string")
  if (typeof raw === "string" && raw.trim()) return [raw.trim()]
  return []
}

// ======================================================
// POST /login
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json().catch(() => ({}))

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta girin." }, { status: 400 })
    }
    if (!isValidPassword(password)) {
      return NextResponse.json({ error: "Şifre en az 3 karakter olmalı." }, { status: 400 })
    }

    const url = `${BACKEND_API_BASE}/api/vbs/auth/login`

    const upstream = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email: String(email).trim(), password }),
    })

    const raw = await upstream.text()
    let data: any = {}

    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {}

    if (!upstream.ok) {
      const msg = data?.error || data?.message || `Giriş başarısız (HTTP ${upstream.status})`
      const resp = NextResponse.json({ error: msg }, { status: upstream.status })

      const ra = upstream.headers.get("Retry-After")
      if (ra) resp.headers.set("Retry-After", ra)

      return noStore(resp)
    }

    const user = data?.user ?? null
    if (!user) {
      return noStore(NextResponse.json({ error: "Beklenmeyen yanıt formatı (user yok)." }, { status: 502 }))
    }

    const roles = normalizeRoles(user.roles)

    // ======================================================
    // 🔥 Session bilgisi (string'e çevrildi)
    // ======================================================
    const sessionVersion = user.sessionVersion ?? null
    const sessionExpiresAt = user.sessionExpiresAt
      ? String(user.sessionExpiresAt)
      : null

    // ======================================================
    // JWT oluştur (tek cihaz login + timeout)
    // ======================================================
    const token = await signSession({
      sub: String(user.id),
      email: String(user.email || ""),
      name: String(user.name || ""),
      roles,
      session_ver: sessionVersion ?? null,
      session_expires_at: sessionExpiresAt ?? null,
    })

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles,
      teacherNumericId: user.teacherNumericId ?? null,
      sessionVersion,
      sessionExpiresAt,
    }

    const resp = NextResponse.json({ user: safeUser }, { status: 200 })

    resp.cookies.set(buildSessionCookie(token, req))
    setRoleCookie(resp, req, roles)

    return noStore(resp)
  } catch (err) {
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

// ======================================================
// GET /login
// ======================================================
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("vbs_session")?.value
    if (!token) {
      return noStore(NextResponse.json({ ok: false }, { status: 401 }))
    }

    const { payload } = await verifySession(token)

    return noStore(
      NextResponse.json({
        ok: true,
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          roles: payload.roles,
        },
      })
    )
  } catch {
    return noStore(NextResponse.json({ ok: false }, { status: 401 }))
  }
}
