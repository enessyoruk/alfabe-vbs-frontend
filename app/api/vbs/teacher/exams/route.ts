//app/api/vbs/teacher/exams/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:5000"

const UPSTREAM = "/api/vbs/teacher/exams"

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

// 🔥 DÜZELTİLMİŞ buildHeaders
function buildHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json"
  }

  // 1) Authorization header varsa kullan
  const ah = req.headers.get("authorization")
  if (ah) headers.Authorization = ah

  // 2) Eğer Authorization yoksa cookie’den token al
  const cookieToken = req.cookies.get("vbs_session")?.value
  if (cookieToken && !headers.Authorization)
    headers.Authorization = `Bearer ${cookieToken}`

  // 3) 🔥 EN KRİTİK: tüm cookie’yi upstream’e gönder
  const cookieHeader = req.headers.get("cookie")
  if (cookieHeader) headers.Cookie = cookieHeader

  return headers
}

// GET — exam list
export async function GET(req: NextRequest) {
  try {
    const headers = buildHeaders(req)
    const search = req.nextUrl.search || ""

    const upstream = await fetch(u(UPSTREAM + search), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers
    })

    const data = await readJson(upstream)
    const res = NextResponse.json(data, { status: upstream.status })

    const ra = upstream.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (e) {
    console.error("[proxy] GET /vbs/teacher/exams:", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

// POST — exam create
export async function POST(req: NextRequest) {
  try {
    const headers = buildHeaders(req)
    const ct = req.headers.get("content-type")
    if (ct) headers["Content-Type"] = ct

    const body = await req.text()

    const upstream = await fetch(u(UPSTREAM), {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers,
      body: body || undefined
    })

    const data = await readJson(upstream)
    const res = NextResponse.json(data, { status: upstream.status })

    const ra = upstream.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (e) {
    console.error("[proxy] POST /vbs/teacher/exams:", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}
