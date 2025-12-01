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
    if (!BACKEND) {
      return noStore(
        NextResponse.json(
          { error: "BACKEND_API_BASE tanımlı değil" },
          { status: 500 }
        )
      )
    }

    const url = `${BACKEND}/api/vbs/teacher/classes`

    const upstream = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        // tarayıcıdaki vbs_session + vbs_role + vbs_auth komple backend'e gidiyor
        cookie: req.headers.get("cookie") ?? ""
      }
    })

    const text = await upstream.text()
    let data: any = {}

    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = { message: text }
    }

    const res = NextResponse.json(data, { status: upstream.status })

    const retryAfter = upstream.headers.get("Retry-After")
    if (retryAfter) res.headers.set("Retry-After", retryAfter)

    return noStore(res)
  } catch (err) {
    console.error("[proxy] /api/teacher/classes error:", err)
    return noStore(
      NextResponse.json(
        { error: "Sunucu hatası" },
        { status: 500 }
      )
    )
  }
}
