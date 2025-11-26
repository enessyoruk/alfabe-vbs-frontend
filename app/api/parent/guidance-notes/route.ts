// app/api/parent/guidance-notes/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

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

const UPSTREAM_PATH = "/api/vbs/parent/guidance"

const u = (path: string) =>
  `${BACKEND_API_BASE}${path.startsWith("/") ? "" : "/"}${path}`

function noStore(res: NextResponse) {
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  )
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
  const headers: Record<string, string> = { Accept: "application/json" }

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

export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    const upstreamUrl = new URL(u(UPSTREAM_PATH))
    req.nextUrl.searchParams.forEach((v, k) =>
      upstreamUrl.searchParams.set(k, v),
    )

    const up = await fetch(upstreamUrl.toString(), {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers,
    })

    // Backend 404 verirse: boş items ile 200 dön
    if (up.status === 404) {
      console.warn(
        "[proxy] /api/vbs/parent/guidance 404, boş items ile 200 dönülüyor.",
      )
      const res = NextResponse.json({ items: [] }, { status: 200 })
      return noStore(res)
    }

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })

    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/parent/guidance-notes error:", e)
    return noStore(
      NextResponse.json(
        {
          items: [],
          error: "Rehberlik notları şu anda yüklenemedi. Lütfen sonra tekrar deneyin.",
        },
        { status: 200 },
      ),
    )
  }
}
