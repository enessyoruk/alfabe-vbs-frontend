// app/api/holidays/route.ts  (mevcut dosyanın yerine uygula)
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

async function readJson(res: Response) {
  const text = await res.text()
  try { return text ? JSON.parse(text) : {} } catch { return text ? { message: text } : {} }
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

// GET /api/holidays  → TR resmi tatilleri (date.nager.at)
export async function GET() {
  try {
    const currentYear = new Date().getFullYear()
    const upstream = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${currentYear}/TR`,
      { method: "GET", cache: "no-store" }
    )

    if (!upstream.ok) {
      const msg = await upstream.text().catch(() => "")
      return noStore(NextResponse.json(
        { error: `Tatil servisi hatası (HTTP ${upstream.status})`, detail: msg || undefined },
        { status: 502 }
      ))
    }

    const apiHolidays = (await upstream.json()) as any[]
    const holidays = apiHolidays.map((holiday: any, index: number) => ({
      id: `${holiday.date}-${index}`,
      name: holiday.localName || holiday.name,
      date: holiday.date,
      type: Array.isArray(holiday.types) && holiday.types.includes("Public") ? "national" : "other",
      description: holiday.name,
    }))

    return noStore(NextResponse.json({ success: true, holidays }, { status: 200 }))
  } catch (e) {
    return noStore(NextResponse.json({ error: "Tatil listesi alınamadı" }, { status: 502 }))
  }
}

// POST /api/holidays  → (Yönetici) tatil bildirimi başlat
// Backend varsayılan uç: POST /api/admin/notifications  (body: { type: "holiday", ... })
export async function POST(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)
    headers["Content-Type"] = "application/json"

    const body = await req.text() // gelen payload olduğu gibi iletilir
    const upstream = await fetch(u("/api/admin/notifications"), {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers,
      body, // ör: { holidayId, message, sendSMS, type: "holiday" }
    })

    const data = await readJson(upstream)
    const res = NextResponse.json(data, { status: upstream.status })
    const ra = upstream.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)
    return noStore(res)
  } catch (e) {
    return noStore(NextResponse.json({ error: "Bildirim servisi hatası" }, { status: 502 }))
  }
}
