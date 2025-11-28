import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

const UPSTREAM = "/api/vbs/teacher/total-students"

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

function buildAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  }

  // 1) Eğer Authorization header varsa → öncelik
  const hAuth = req.headers.get("authorization") || ""
  if (hAuth.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = hAuth
  }
  // 2) Yoksa → vbs_session çerezini Bearer yap
  else {
    const token = req.cookies.get("vbs_session")?.value
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  // Normal cookie forward (opsiyonel)
  const raw = req.headers.get("cookie")
  if (raw) headers.Cookie = raw

  return headers
}

export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    const up = await fetch(u(UPSTREAM), {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers
    })

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })

    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (err) {
    console.error("[proxy] GET /teacher/total-students", err)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    )
  }
}
