// app/api/teacher/reports/route.ts
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

const UPSTREAM = "/api/vbs/teacher/reports"

const u = (p: string) =>
  `${BACKEND}${p.startsWith("/") ? "" : "/"}${p}`

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

async function readJson(r: Response) {
  const t = await r.text()
  try { return t ? JSON.parse(t) : {} }
  catch { return t ? { message: t } : {} }
}

// ---------------- AUTH STANDARD ----------------
function buildAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" }

  // 1) Authorization header → en yüksek öncelik
  const ah = req.headers.get("authorization") || ""
  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
  } else {
    // 2) Cookie → vbs_session → fallback Bearer
    const token = req.cookies.get("vbs_session")?.value
    if (token) headers.Authorization = `Bearer ${token}`
  }

  // 3) Cookie forward
  const rawCookie = req.headers.get("cookie")
  if (rawCookie) headers.Cookie = rawCookie

  return headers
}

// --------------------- GET ---------------------
export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    // Query string forward
    const upstreamUrl = new URL(u(UPSTREAM))
    req.nextUrl.searchParams.forEach((v, k) =>
      upstreamUrl.searchParams.set(k, v)
    )

    const up = await fetch(upstreamUrl.toString(), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers,
    })

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })

    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)

  } catch (e) {
    console.error("[proxy] GET /api/teacher/reports", e)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    )
  }
}

// --------------------- POST ---------------------
export async function POST(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    // Content-Type forward
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
    const res = NextResponse.json(data, { status: up.status })

    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)

  } catch (e) {
    console.error("[proxy] POST /api/teacher/reports", e)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    )
  }
}
