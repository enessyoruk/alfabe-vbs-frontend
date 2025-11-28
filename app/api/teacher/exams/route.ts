import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

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
  try {
    return t ? JSON.parse(t) : {}
  } catch {
    return t ? { message: t } : {}
  }
}

// ---------- AUTH HEADER + COOKIE ----------
function buildAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  }

  // 1) Bearer var → direkt kullan
  const ah = req.headers.get("authorization") || ""
  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
  } else {
    // 2) Bearer yoksa → JWT cookie → Authorization: Bearer <token>
    const token = req.cookies.get("vbs_session")?.value
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  // 3) Tüm çerezleri forward
  const rawCookie = req.headers.get("cookie")
  if (rawCookie) headers.Cookie = rawCookie

  return headers
}

// ====================================================
// GET → Öğretmene ait sınav listesi
// ====================================================
export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)
    const search = req.nextUrl.search || ""

    const up = await fetch(u(UPSTREAM + search), {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers,
    })

    // Backend endpoint yoksa boş dönelim
    if (up.status === 404) {
      return noStore(
        NextResponse.json({ exams: [] }, { status: 200 })
      )
    }

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })

    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)

  } catch (err) {
    console.error("[proxy] GET /teacher/exams", err)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

// ====================================================
// POST → Öğretmen yeni sınav yükler
// ====================================================
export async function POST(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    // Content-Type forward
    const ct = req.headers.get("content-type")
    if (ct) headers["Content-Type"] = ct

    // Body aynen forward
    const body = await req.text()

    const up = await fetch(u(UPSTREAM), {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers,
      body: body || undefined,
    })

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })

    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)

  } catch (err) {
    console.error("[proxy] POST /teacher/exams", err)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}
