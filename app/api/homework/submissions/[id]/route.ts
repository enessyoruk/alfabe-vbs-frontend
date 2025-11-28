// app/api/teacher/homework/[id]/submissions/route.ts
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// 🔧 ENV
const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND_API_BASE) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

const u = (p: string) =>
  `${BACKEND_API_BASE}${p.startsWith("/") ? "" : "/"}${p}`

// no-store helper
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

/* -------------------------------------------
   AUTH — FINAL TOKEN MODEL
   ------------------------------------------- */
function buildAuthHeaders(req: NextRequest) {
  const headers: Record<string, string> = { Accept: "application/json" }

  // (1) Authorization header varsa → önce o
  const ah = req.headers.get("authorization") || ""
  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
  } else {
    // (2) Yoksa HttpOnly vbs_session → Bearer token
    const token = req.cookies.get("vbs_session")?.value
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  // (3) Cookie forward — sadece backup, zorunlu değil
  const incomingCookie = req.headers.get("cookie")
  if (incomingCookie) {
    headers.Cookie = incomingCookie
  }

  return headers
}

/* -------------------------------------------
   GET — HOMEWORK SUBMISSIONS
   ------------------------------------------- */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headers = buildAuthHeaders(req)

    const homeworkId = params.id
    if (!homeworkId) {
      return noStore(
        NextResponse.json({ error: "Missing homework id" }, { status: 400 })
      )
    }

    // Query parametrelerini aynen forward et
    const upstreamUrl = new URL(
      u(`/api/vbs/teacher/homework/${homeworkId}/submissions`)
    )
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

    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (err) {
    console.error("[proxy] /api/teacher/homework/[id]/submissions GET", err)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    )
  }
}
