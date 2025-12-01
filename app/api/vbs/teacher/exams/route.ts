import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

// 🔥 Upstream backend path (Sadece backend hedefi!)
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

function buildHeaders(req: NextRequest) {
  const h: any = { Accept: "application/json" }

  const jwt = req.cookies.get("vbs_session")?.value
  if (jwt) h.Authorization = `Bearer ${jwt}`

  // ✔ Cookie forwarding
  const rawCookie = req.headers.get("cookie")
  if (rawCookie) h.Cookie = rawCookie

  return h
}

export async function GET(req: NextRequest) {
  try {
    const headers = buildHeaders(req)
    const search = req.nextUrl.search || ""

    // 🔥 DÜZELTİLMİŞ FETCH — backend’e gidiyor
    const upstream = await fetch(u(UPSTREAM + search), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers,
    })

    const data = await readJson(upstream)
    return noStore(
      NextResponse.json(data, { status: upstream.status })
    )
  } catch (e) {
    console.error("[proxy exams GET error]", e)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    )
  }
}

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
      body: body || undefined,
    })

    const data = await readJson(upstream)
    return noStore(
      NextResponse.json(data, { status: upstream.status })
    )
  } catch (e) {
    console.error("[proxy exams POST error]", e)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    )
  }
}
