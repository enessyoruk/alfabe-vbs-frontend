// app/api/teacher/classes/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND = process.env.BACKEND_API_BASE || process.env.NEXT_PUBLIC_API_BASE

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

export async function GET(req: NextRequest) {
  try {
    const url = `${BACKEND}/api/vbs/teacher/classes`

    const upstream = await fetch(url, {
      method: "GET",
      credentials: "include",     // 🔥 Cookie forward buradan yapılır
      cache: "no-store",
      headers: {
        Accept: "application/json"
        // ❌ Authorization YOK
        // ❌ Cookie header YOK
      }
    })

    const raw = await upstream.text()
    let data: any
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = { message: raw }
    }

    const res = NextResponse.json(data, { status: upstream.status })

    const ra = upstream.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (err) {
    console.error("[proxy] /api/teacher/classes", err)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}
