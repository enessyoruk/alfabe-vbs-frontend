import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  ""

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

async function readJson(r: Response) {
  const txt = await r.text()
  try {
    return txt ? JSON.parse(txt) : {}
  } catch {
    return txt ? { message: txt } : {}
  }
}

export async function GET(req: NextRequest) {
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    }

    // 🔥 Gelen cookie'leri birebir backend’e taşı
    const incomingCookie = req.headers.get("cookie")
    if (incomingCookie) {
      headers.Cookie = incomingCookie
    }

    const upstream = await fetch(`${BACKEND}/api/vbs/parent/students`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers,
    })

    const data = await readJson(upstream)

    return noStore(
      NextResponse.json(
        upstream.ok
          ? data
          : { items: [], count: 0, error: "Backend error" },
        { status: 200 }
      )
    )
  } catch (err) {
    console.error("[proxy] /parent/students error:", err)
    return noStore(
      NextResponse.json(
        { items: [], count: 0, error: "Sunucu hatası" },
        { status: 200 }
      )
    )
  }
}
