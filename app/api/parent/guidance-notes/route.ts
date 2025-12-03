// app/api/parent/guidance-notes/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

const UPSTREAM = `${BACKEND}/api/vbs/parent/guidance`

export async function GET(req: NextRequest) {
  try {
    // Tarayıcıdan gelen cookie'yi backend'e forward et
    const cookieHeader = req.headers.get("cookie") ?? ""

    const upstream = await fetch(UPSTREAM, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
      },
      cache: "no-store",
    })

    const text = await upstream.text()
    let data: any

    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = { raw: text }
    }

    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    console.error("[parent/guidance-notes proxy] error", err)
    return NextResponse.json(
      { items: [], error: "Proxy error" },
      { status: 500 }
    )
  }
}

