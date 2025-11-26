// app/api/teacher/homework/route.ts
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

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


const u = (path: string) => `${BACKEND_API_BASE}${path.startsWith("/") ? "" : "/"}${path}`

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

async function readJson(res: Response) {
  const text = await res.text()
  try { return text ? JSON.parse(text) : {} } catch { return text ? { message: text } : {} }
}

function buildAuthHeaders(req: NextRequest) {
  const headers: Record<string, string> = { Accept: "application/json" }

  // Authorization header öncelikli; yoksa cookie token (opsiyonel)
  const ah = req.headers.get("authorization") || ""
  const cookieToken = req.cookies.get("authToken")?.value
  if (ah.toLowerCase().startsWith("bearer ")) headers.Authorization = ah
  else if (cookieToken) headers.Authorization = `Bearer ${cookieToken}`

  // Cookie-based oturum varsa çerezi upstream’e geçir
  const incomingCookie = req.headers.get("cookie")
  if (incomingCookie) headers.Cookie = incomingCookie

  return headers
}

// GET /api/teacher/homework?classId=...
export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    const incoming = new URL(req.url)
    const target = new URL(u("/api/vbs/teacher/homework"))
    const classId = incoming.searchParams.get("classId")
    if (classId) target.searchParams.set("classId", classId)

    const upstream = await fetch(target.toString(), {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers,
    })

    const body = await readJson(upstream)
    const res = NextResponse.json(body, { status: upstream.status })
    const ra = upstream.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)
    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/teacher/homework GET", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

// POST /api/teacher/homework
export async function POST(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)
    headers["Content-Type"] = "application/json"

    const bodyText = await req.text() // gövdeyi değiştirmeden ilet
    const upstream = await fetch(u("/api/vbs/teacher/homework"), {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers,
      body: bodyText,
    })

    const body = await readJson(upstream)
    const res = NextResponse.json(body, { status: upstream.status })
    const ra = upstream.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)
    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/teacher/homework POST", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

// PUT /api/teacher/homework
export async function PUT(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)
    headers["Content-Type"] = "application/json"

    const bodyText = await req.text()
    const upstream = await fetch(u("/api/vbs/teacher/homework"), {
      method: "PUT",
      cache: "no-store",
      credentials: "include",
      headers,
      body: bodyText,
    })

    const body = await readJson(upstream)
    const res = NextResponse.json(body, { status: upstream.status })
    const ra = upstream.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)
    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/teacher/homework PUT", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

// DELETE /api/teacher/homework?id=123  veya  /api/teacher/homework?action=cleanup
export async function DELETE(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    const incoming = new URL(req.url)
    const target = new URL(u("/api/vbs/teacher/homework"))
    const id = incoming.searchParams.get("id")
    const action = incoming.searchParams.get("action")
    if (id) target.searchParams.set("id", id)
    if (action) target.searchParams.set("action", action)

    const upstream = await fetch(target.toString(), {
      method: "DELETE",
      cache: "no-store",
      credentials: "include",
      headers,
    })

    const body = await readJson(upstream)
    const res = NextResponse.json(body, { status: upstream.status })
    const ra = upstream.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)
    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/teacher/homework DELETE", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}
