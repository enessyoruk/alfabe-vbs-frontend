// app/api/teacher/classes/route.ts
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function requiredEnv(name: string): string {
  const val = process.env[name]
  if (!val || !val.trim()) {
    throw new Error(`Missing env: ${name}`)
  }
  return val
}

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND_API_BASE) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

const UPSTREAM_PATH = "/api/vbs/teacher/classes"

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

export async function GET(req: NextRequest) {
  try {
    const headers: Record<string, string> = { Accept: "application/json" }

    // ---- Doğru cookie (vbs_session) ----
    const cookieToken = req.cookies.get("vbs_session")?.value

    if (cookieToken) {
      headers.Authorization = `Bearer ${cookieToken}`
    }

    // ---- Cookie-based oturum forward ----
    const incomingCookie = req.headers.get("cookie")
    if (incomingCookie) {
      headers.Cookie = incomingCookie
    }

    // ---- Query param’ları koru ----
    const url = new URL(req.url)
    const upstreamUrl = new URL(u(UPSTREAM_PATH))
    url.searchParams.forEach((v, k) => upstreamUrl.searchParams.set(k, v))

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
  } catch (e) {
    console.error("[proxy] /api/teacher/classes GET", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}
