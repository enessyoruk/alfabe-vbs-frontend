// app/api/parent/payments/route.ts  (mevcut dosyanın yerine)
import { type NextRequest, NextResponse } from "next/server"

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


const u = (p: string) => `${BACKEND_API_BASE}${p.startsWith("/") ? "" : "/"}${p}`

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

async function readJson(r: Response) {
  const t = await r.text()
  try { return t ? JSON.parse(t) : {} } catch { return t ? { message: t } : {} }
}

function buildAuthHeaders(req: NextRequest) {
  const headers: Record<string, string> = { Accept: "application/json" }
  const ah = req.headers.get("authorization") || ""
  const cookieToken = req.cookies.get("authToken")?.value
  if (ah.toLowerCase().startsWith("bearer ")) headers.Authorization = ah
  else if (cookieToken) headers.Authorization = `Bearer ${cookieToken}`
  const incomingCookie = req.headers.get("cookie")
  if (incomingCookie) headers.Cookie = incomingCookie
  return headers
}

// ------- GET: ödemeleri listele (studentId, status gibi query’leri aynen iletir) -------
export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)
    const upstreamUrl = new URL(u("/api/vbs/parent/payments"))
    req.nextUrl.searchParams.forEach((v, k) => upstreamUrl.searchParams.set(k, v))

    const up = await fetch(upstreamUrl.toString(), {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers,
    })

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })
    const ra = up.headers.get("Retry-After"); if (ra) res.headers.set("Retry-After", ra)
    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/parent/payments GET", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

// ------- POST: ödeme işlemi (body aynen iletilir) -------
export async function POST(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)
    headers["Content-Type"] = "application/json"
    const body = await req.text()

    const up = await fetch(u("/api/vbs/parent/payments"), {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers,
      body,
    })

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })
    const ra = up.headers.get("Retry-After"); if (ra) res.headers.set("Retry-After", ra)
    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/parent/payments POST", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}
