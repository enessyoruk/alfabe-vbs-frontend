// app/api/vbs/teacher/guidance/route.ts
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"



// Env fallback
function requiredEnv(name: string): string {
  const val = process.env[name]
  if (!val || !val.trim()) {
    throw new Error(`Missing env: ${name}`)
  }
  return val
}

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND_API_BASE) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

const UPSTREAM_PATH = "/api/vbs/teacher/guidance"

const u = (p: string) =>
  `${BACKEND_API_BASE}${p.startsWith("/") ? "" : "/"}${p}`

function noStore(res: NextResponse) {
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  )
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

async function readJson(r: Response) {
  const t = await r.text()
  try {
    return t ? JSON.parse(t) : {}
  } catch {
    return t ? { message: t } : {}
  }
}

function buildAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  }

  // Eğer Authorization varsa → kullan
  const ah = req.headers.get("authorization") || ""
  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
  } else {
    // HttpOnly cookie → vbs_session
    const session = req.cookies.get("vbs_session")?.value
    if (session) {
      headers.Authorization = `Bearer ${session}`
    }
  }

  // Normal Cookie header — bazı isteklerde boştur
  const incomingCookie = req.headers.get("cookie")
  if (incomingCookie) {
    headers.Cookie = incomingCookie
  }

  // ⭐ ZORUNLU FIX ⭐
  // Next runtime cookie'yi POST/PUT sırasında saklıyor → biz zorla iletiyoruz
  const raw = req.cookies.toString()
  if (raw) {
    headers["X-Forwarded-Cookie"] = raw
  }

  return headers
}



// GET: Öğrenci rehberlik verileri
export async function GET(req: NextRequest) {
  

  try {
    const headers = buildAuthHeaders(req)

    const upstreamUrl = new URL(u(UPSTREAM_PATH))
    req.nextUrl.searchParams.forEach((v, k) =>
      upstreamUrl.searchParams.set(k, v),
    )

    const up = await fetch(upstreamUrl.toString(), {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers,
    })

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })

    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/teacher/guidance GET", e)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }),
    )
  }
}

// POST: Yeni rehberlik notu ekleme
export async function POST(req: NextRequest) {
 

  try {
    const headers = buildAuthHeaders(req)

    const ct = req.headers.get("content-type")
    if (ct) headers["Content-Type"] = ct

    const body = await req.text()

    const up = await fetch(u(UPSTREAM_PATH), {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers,
      body,
    })

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })

    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/teacher/guidance POST", e)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }),
    )
  }
}

// PUT: Rehberlik kaydı güncelleme
export async function PUT(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    const ct = req.headers.get("content-type")
    if (ct) headers["Content-Type"] = ct

    const body = await req.text()

    const up = await fetch(u(UPSTREAM_PATH), {
      method: "PUT",
      cache: "no-store",
      credentials: "include",
      headers,
      body,
    })

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })

    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/teacher/guidance PUT", e)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }),
    )
  }
}
