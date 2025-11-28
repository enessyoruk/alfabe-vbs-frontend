import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  ""

if (!BACKEND_API_BASE) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

const UPSTREAM_PATH = "/api/vbs/teacher/exams/analysis"

const u = (p: string) =>
  `${BACKEND_API_BASE}${p.startsWith("/") ? "" : "/"}${p}`

// ─────────────────────────────────────────────
// no-store
// ─────────────────────────────────────────────
function noStore(res: NextResponse) {
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  )
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

// ─────────────────────────────────────────────
// Safe JSON parse
// ─────────────────────────────────────────────
async function readJson(r: Response) {
  const t = await r.text()
  try {
    return t ? JSON.parse(t) : {}
  } catch {
    return t ? { message: t } : {}
  }
}

// ─────────────────────────────────────────────
// Bearer Auth Builder (ONLY vbs_session)
// ─────────────────────────────────────────────
function buildAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" }

  const h = req.headers.get("authorization") || ""
  if (h.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = h
    return headers
  }

  const token = req.cookies.get("vbs_session")?.value
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

// ─────────────────────────────────────────────
// POST — Create / update exam analysis
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    const ct = req.headers.get("content-type")
    if (ct) headers["Content-Type"] = ct

    const body = await req.text()

    const up = await fetch(u(UPSTREAM_PATH), {
      method: "POST",
      cache: "no-store",
      headers,
      body: body || undefined,
    })

    const data = await readJson(up)

    if (up.ok) {
      const res = NextResponse.json(data, { status: 200 })
      return noStore(res)
    }

    // Fallback — UI çökmemesi için
    const fallback = {
      error:
        (data as any)?.error ||
        (data as any)?.message ||
        `Sınav analizi gönderilemedi (HTTP ${up.status})`,
    }

    const res = NextResponse.json(fallback, { status: 200 })
    return noStore(res)
  } catch (err) {
    console.error("[proxy] POST /api/vbs/teacher/exams/analysis", err)
    const res = NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 200 }
    )
    return noStore(res)
  }
}
