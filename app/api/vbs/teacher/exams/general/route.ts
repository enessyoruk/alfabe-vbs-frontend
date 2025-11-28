import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Base URL
const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

const UPSTREAM = "/api/vbs/teacher/exams/general"

// Build full URL
const u = (p: string) =>
  `${BACKEND}${p.startsWith("/") ? "" : "/"}${p}`

// No-store headers
function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

// Safe JSON reader
async function readJson(r: Response) {
  const t = await r.text()
  try {
    return t ? JSON.parse(t) : {}
  } catch {
    return t ? { message: t } : {}
  }
}

// Token handler (Bearer priority)
function buildAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" }

  const hAuth = req.headers.get("authorization") || ""
  const cookieToken = req.cookies.get("vbs_session")?.value

  if (hAuth.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = hAuth
  } else if (cookieToken) {
    // Cookie → Bearer dönüşümü (token mode)
    headers.Authorization = `Bearer ${cookieToken}`
  }

  // Optional cookie forward — no auth impact
  const rawCookie = req.headers.get("cookie")
  if (rawCookie) headers.Cookie = rawCookie

  return headers
}

// --------------------------
// GET → exam list
// --------------------------
export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)
    const q = req.nextUrl.search || ""
    const url = u(UPSTREAM + q)

    const up = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers,
    })

    const data = await readJson(up)

    const resp = NextResponse.json(data, { status: up.status })
    const ra = up.headers.get("Retry-After")
    if (ra) resp.headers.set("Retry-After", ra)

    return noStore(resp)
  } catch (err) {
    console.error("[proxy] GET /api/vbs/teacher/exams/general", err)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

// --------------------------
// POST → create exam
// --------------------------
export async function POST(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    const ct = req.headers.get("content-type")
    if (ct) headers["Content-Type"] = ct

    const body = await req.text()

    const up = await fetch(u(UPSTREAM), {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers,
      body: body || undefined,
    })

    const data = await readJson(up)

    const resp = NextResponse.json(data, { status: up.status })
    const ra = up.headers.get("Retry-After")
    if (ra) resp.headers.set("Retry-After", ra)

    return noStore(resp)
  } catch (err) {
    console.error("[proxy] POST /api/vbs/teacher/exams/general", err)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

// --------------------------
// DELETE → delete exam
// --------------------------
export async function DELETE(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)
    const q = req.nextUrl.search || ""
    const url = u(UPSTREAM + q)

    const up = await fetch(url, {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
      headers,
    })

    const data = await readJson(up)

    const resp = NextResponse.json(data, { status: up.status })
    const ra = up.headers.get("Retry-After")
    if (ra) resp.headers.set("Retry-After", ra)

    return noStore(resp)
  } catch (err) {
    console.error("[proxy] DELETE /api/vbs/teacher/exams/general", err)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}
