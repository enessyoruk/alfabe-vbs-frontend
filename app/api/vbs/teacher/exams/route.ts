// app/api/vbs/teacher/exams/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ===============================
// ENV
// ===============================
const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND) {
  throw new Error("BACKEND_API_BASE / NEXT_PUBLIC_API_BASE missing")
}

const UPSTREAM_PATH = "/api/vbs/teacher/exams"

const u = (p: string) =>
  `${BACKEND}${p.startsWith("/") ? "" : "/"}${p}`

// ===============================
// HELPERS
// ===============================
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
    return { raw: t }
  }
}

function buildAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: any = { Accept: "application/json" }

  // Bearer → varsa aynen geç
  const ah = req.headers.get("authorization") || ""
  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
  } else {
    // Cookie → vbs_session
    const token = req.cookies.get("vbs_session")?.value
    if (token) headers.Authorization = `Bearer ${token}`
  }

  // Cookie'leri backend'e yansıt
  const incoming = req.headers.get("cookie")
  if (incoming) headers.Cookie = incoming

  return headers
}

// ===============================
// GET → sınav listesini getir
// ===============================
export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    const upstreamUrl = new URL(u(UPSTREAM_PATH))
    req.nextUrl.searchParams.forEach((v, k) =>
      upstreamUrl.searchParams.set(k, v)
    )

    const up = await fetch(upstreamUrl.toString(), {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers,
    })

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })

    const retry = up.headers.get("Retry-After")
    if (retry) res.headers.set("Retry-After", retry)

    return noStore(res)
  } catch (err) {
    console.error("[proxy exams GET]", err)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    )
  }
}

// ===============================
// POST → yeni sınav oluştur
// ===============================
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
      body: body || undefined,
    })

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })

    const retry = up.headers.get("Retry-After")
    if (retry) res.headers.set("Retry-After", retry)

    return noStore(res)
  } catch (err) {
    console.error("[proxy exams POST]", err)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    )
  }
}
