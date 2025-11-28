// app/api/teacher/homework/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// ENV
const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND_API_BASE) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

const u = (p: string) =>
  `${BACKEND_API_BASE}${p.startsWith("/") ? "" : "/"}${p}`

// no-store
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
   AUTH — TOKEN MODEL
   ------------------------------------------- */
function buildAuthHeaders(req: NextRequest) {
  const headers: Record<string, string> = { Accept: "application/json" }

  const ah = req.headers.get("authorization") || ""
  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
  } else {
    const token = req.cookies.get("vbs_session")?.value
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const incomingCookie = req.headers.get("cookie")
  if (incomingCookie) headers.Cookie = incomingCookie

  return headers
}

/* -------------------------------------------
   GET — Single Homework Detail
   ------------------------------------------- */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const homeworkId = params.id
    if (!homeworkId) {
      return noStore(
        NextResponse.json({ error: "Missing homework id" }, { status: 400 })
      )
    }

    const headers = buildAuthHeaders(req)

    const upstreamUrl = u(`/api/vbs/teacher/homework/${homeworkId}`)

    const up = await fetch(upstreamUrl, {
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
    console.error("[proxy] GET /api/teacher/homework/[id]", err)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    )
  }
}
