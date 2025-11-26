// app/api/vbs/teacher/exams/general/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

const UPSTREAM_PATH = "/api/vbs/teacher/exams/general"

const u = (p: string) =>
  `${BACKEND_API_BASE}${p.startsWith("/") ? "" : "/"}${p}`

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
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

  // 🔑 VBS oturumu → vbs_session çerezi
  const ah = req.headers.get("authorization") || ""
  const cookieToken = req.cookies.get("vbs_session")?.value

  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
  } else if (cookieToken) {
    headers.Authorization = `Bearer ${cookieToken}`
  }

  const incomingCookie = req.headers.get("cookie")
  if (incomingCookie) headers.Cookie = incomingCookie

  return headers
}

// GET → sınav listesi (teacher paneli)
export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)
    const search = req.nextUrl.search || ""
    const upstreamUrl = u(UPSTREAM_PATH + search)

    const up = await fetch(upstreamUrl, {
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
    console.error("[proxy] GET /api/vbs/teacher/exams/general", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

// POST → yeni genel sınav oluşturma
export async function POST(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    const ct = req.headers.get("content-type")
    if (ct) headers["Content-Type"] = ct

    const bodyText = await req.text()

    const up = await fetch(u(UPSTREAM_PATH), {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers,
      body: bodyText || undefined,
    })

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })

    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (e) {
    console.error("[proxy] POST /api/vbs/teacher/exams/general", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

// DELETE → sınav silme (?id=23 gibi query ile çağrılıyor)
export async function DELETE(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)
    const search = req.nextUrl.search || ""
    const upstreamUrl = u(UPSTREAM_PATH + search)

    const up = await fetch(upstreamUrl, {
      method: "DELETE",
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
    console.error("[proxy] DELETE /api/vbs/teacher/exams/general", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}
