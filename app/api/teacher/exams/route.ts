// app/api/teacher/exams/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:5000"

const UPSTREAM_PATH = "/api/vbs/teacher/exams"

const u = (p: string) => `${BACKEND_API_BASE}${p.startsWith("/") ? "" : "/"}${p}`

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

  const ah = req.headers.get("authorization") || ""
  const cookieToken = req.cookies.get("authToken")?.value

  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
  } else if (cookieToken) {
    headers.Authorization = `Bearer ${cookieToken}`
  }

  const incomingCookie = req.headers.get("cookie")
  if (incomingCookie) headers.Cookie = incomingCookie

  return headers
}

// GET  -> Sınav listesi
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

    // Backend’de henüz endpoint yoksa 404 gelecek.
    // Frontend hata almak yerine boş liste görsün:
    if (up.status === 404) {
      return noStore(
        NextResponse.json(
          {
            exams: [],
          },
          { status: 200 },
        ),
      )
    }

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })

    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (e) {
    console.error("[proxy] GET /api/teacher/exams", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

// POST -> Sınav / sınav sonucu yükleme
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
    console.error("[proxy] POST /api/teacher/exams", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}
