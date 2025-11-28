import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

const UPSTREAM = "/api/vbs/teacher/exams/upload-image"

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
  try {
    return t ? JSON.parse(t) : {}
  } catch {
    return t ? { message: t } : {}
  }
}

// -------- AUTH HEADER STANDART --------
function buildAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json"
  }

  // 1) Authorization header varsa → öncelik
  const ah = req.headers.get("authorization") || ""
  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
  } else {
    // 2) Yoksa → HttpOnly JWT cookie (vbs_session)
    const token = req.cookies.get("vbs_session")?.value
    if (token) headers.Authorization = `Bearer ${token}`
  }

  // 3) Tüm incoming cookie'leri backend'e gönder
  const rawCookie = req.headers.get("cookie")
  if (rawCookie) headers.Cookie = rawCookie

  return headers
}

// ==========================================================
// POST → Teacher exam image upload
// ==========================================================
export async function POST(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    // ❗ FormData forward (en güvenli yol)
    const incoming = await req.formData()
    const forward = new FormData()

    for (const [key, val] of incoming.entries()) {
      forward.append(key, val as any)
    }

    const up = await fetch(u(UPSTREAM), {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers,         // ❗ content-type koymuyoruz → boundary bozulur
      body: forward,
    })

    const data = await readJson(up)

    const res = NextResponse.json(data, { status: up.status })

    const retry = up.headers.get("Retry-After")
    if (retry) res.headers.set("Retry-After", retry)

    return noStore(res)

  } catch (err) {
    console.error("[proxy] POST /teacher/exams/upload-image", err)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    )
  }
}
