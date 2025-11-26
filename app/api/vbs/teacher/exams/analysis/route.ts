// app/api/vbs/teacher/exams/analysis/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Backend base URL
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

// Upstream endpoint
const UPSTREAM_PATH = "/api/vbs/teacher/exams/analysis"

// Full URL builder
const u = (p: string) =>
  `${BACKEND_API_BASE}${p.startsWith("/") ? "" : "/"}${p}`

// No-store headers
function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

// Body parse helper
async function readJson(r: Response) {
  const t = await r.text()
  try {
    return t ? JSON.parse(t) : {}
  } catch {
    return t ? { message: t } : {}
  }
}

// Authorization + cookies forward
function buildAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  }

  // Bearer → vbs_session → nothing
  const ah = req.headers.get("authorization") || ""
  const cookieToken = req.cookies.get("vbs_session")?.value

  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
  } else if (cookieToken) {
    headers.Authorization = `Bearer ${cookieToken}`
  }

  // Forward cookies directly
  const incomingCookie = req.headers.get("cookie")
  if (incomingCookie) headers.Cookie = incomingCookie

  return headers
}

// POST → create exam analysis
export async function POST(req: NextRequest) {
  try {
    // Build auth headers
    const headers = buildAuthHeaders(req)

    // Forward correct content type
    const ct = req.headers.get("content-type")
    if (ct) headers["Content-Type"] = ct

    // Read body exactly as-is
    const bodyText = await req.text()

    // Send to backend
    const upstream = await fetch(u(UPSTREAM_PATH), {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers,
      body: bodyText || undefined,
    })

    // Parse backend response
    const data = await readJson(upstream)

    // Build proxy response
    const res = NextResponse.json(data, { status: upstream.status })

    // Forward Retry-After if exists
    const ra = upstream.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (err) {
    console.error("[proxy] POST /api/vbs/teacher/exams/analysis", err)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    )
  }
}
