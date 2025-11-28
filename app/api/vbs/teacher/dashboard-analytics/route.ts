// app/api/vbs/teacher/dashboard-analytics/route.ts
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
    const classId = req.nextUrl.searchParams.get("classId")

    if (!classId) {
      return noStore(
        NextResponse.json(
          { error: "classId gereklidir." },
          { status: 400 }
        )
      )
    }

    // -------- TOKEN AL -----------
    const token = req.headers.get("x-vbs-token")
    if (!token) {
      return noStore(
        NextResponse.json(
          { error: "Token missing" },
          { status: 401 }
        )
      )
    }

    const url = `${BACKEND}/api/vbs/teacher/dashboard-analytics?classId=${encodeURIComponent(classId)}`

    // -------- BACKEND'E İSTEĞİ GÖNDER -----------
    const upstream = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`, // ⭐ KRİTİK
      },
    })

    const raw = await upstream.text()
    let data: any = {}

    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = { message: raw }
    }

    const resp = NextResponse.json(
      upstream.ok ? data : { error: "Backend error", status: upstream.status },
      { status: upstream.ok ? 200 : upstream.status }
    )

    const retryAfter = upstream.headers.get("Retry-After")
    if (retryAfter) resp.headers.set("Retry-After", retryAfter)

    return noStore(resp)
  } catch (err) {
    console.error("proxy /dashboard-analytics error:", err)
    return noStore(
      NextResponse.json(
        { error: "Proxy error", details: String(err) },
        { status: 500 }
      )
    )
  }
}
