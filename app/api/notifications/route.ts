// app/api/notifications/route.ts
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


const u = (path: string) => `${BACKEND_API_BASE}${path.startsWith("/") ? "" : "/"}${path}`

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

async function readJson(res: Response) {
  const text = await res.text()
  try { return text ? JSON.parse(text) : {} } catch { return text ? { message: text } : {} }
}

/**
 * GET /api/notifications
 * Backend: GET /api/vbs/parent/notifications
 * Authorization: Header’daki Bearer veya cookie’deki authToken Bearer olarak forward edilir.
 */
export async function GET(req: NextRequest) {
  try {
    const headers: Record<string, string> = { Accept: "application/json" }

    const authHeader = req.headers.get("authorization") || ""
    const cookieAuthToken = req.cookies.get("authToken")?.value
    if (authHeader.toLowerCase().startsWith("bearer ")) headers.Authorization = authHeader
    else if (cookieAuthToken) headers.Authorization = `Bearer ${cookieAuthToken}`

    // Cookie-based oturum varsa çerezi upstream’e geçir
    const incomingCookie = req.headers.get("cookie")
    if (incomingCookie) headers.Cookie = incomingCookie

    const upstream = await fetch(u("/api/vbs/parent/notifications"), {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers,
    })

    const data = await readJson(upstream)
    const res = NextResponse.json(data, { status: upstream.status })
    const ra = upstream.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)
    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/notifications error:", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

/**
 * PUT /api/notifications
 * Not: Backend’de henüz read/mark-as-read uçları yok. 405 dönüyoruz.
 */
export async function PUT() {
  return NextResponse.json(
    { error: "Güncelleme desteklenmiyor (backend PUT endpointi yok)" },
    { status: 405 }
  )
}
