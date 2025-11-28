// app/api/parent/students/route.ts
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
    // ----------- TOKEN AL -----------
    const token = req.headers.get("x-vbs-token")

    if (!token) {
      return noStore(
        NextResponse.json(
          { items: [], count: 0, error: "Token missing" },
          { status: 401 }
        )
      )
    }

    const url = `${BACKEND}/api/vbs/parent/students`

    // ----------- BACKEND'E İSTEĞİ GÖNDER -----------
    const upstream = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,   // ⭐ KRİTİK
      },
    })

    const raw = await upstream.text()
    let data: any = {}

    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = { message: raw }
    }

    // Backend 401/403 döndürse bile FE'ye 200 ve boş liste döner (eski davranışla uyumlu)
    const resp = NextResponse.json(
      upstream.ok ? data : { items: [], count: 0 },
      { status: 200 }
    )

    const retryAfter = upstream.headers.get("Retry-After")
    if (retryAfter) resp.headers.set("Retry-After", retryAfter)

    return noStore(resp)
  } catch (err) {
    console.error("proxy /parent/students error:", err)
    return noStore(
      NextResponse.json(
        { items: [], count: 0, error: "Proxy error" },
        { status: 200 }
      )
    )
  }
}
