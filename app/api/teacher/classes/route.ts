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
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        cookie: req.headers.get("cookie") ?? ""   // 🔥 ÇÖZÜM
      }
    })

    const body = await upstream.text()
    let data: any = {}
    try { data = body ? JSON.parse(body) : {} } catch { data = { message: body } }

    const res = NextResponse.json(data, { status: upstream.status })
    const ra = upstream.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)

  } catch {
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}
