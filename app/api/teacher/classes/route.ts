// app/api/teacher/classes/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is missing")
}

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

export async function GET(req: NextRequest) {
  try {
    // ----------- TOKEN OKUMA -----------
    // FE → login'de token'ı localStorage'a yazdı.
    // BU ROUTE → browser'dan gelen custom header üzerinden token'ı okur.
    const token = req.headers.get("x-vbs-token")

    if (!token) {
      return noStore(
        NextResponse.json({ error: "Token missing" }, { status: 401 })
      )
    }

    const url = `${BACKEND}/api/vbs/teacher/classes`

    // ----------- BACKEND REQUEST -----------
    const upstream = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`, // ⭐ CRITICAL
      }
    })

    const raw = await upstream.text()
    let data: any = {}

    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = { message: raw }
    }

    const res = NextResponse.json(data, { status: upstream.status })

    const retryAfter = upstream.headers.get("Retry-After")
    if (retryAfter) res.headers.set("Retry-After", retryAfter)

    return noStore(res)
  } catch (err) {
    console.error("proxy /api/teacher/classes error:", err)
    return noStore(
      NextResponse.json({ error: "Proxy error" }, { status: 500 })
    )
  }
}
