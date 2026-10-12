import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND) {
  throw new Error("BACKEND_API_BASE / NEXT_PUBLIC_API_BASE missing")
}

const UPSTREAM = `${BACKEND}/api/vbs/parent/students`

function buildAuthHeaders(req: NextRequest) {
  const headers: Record<string, string> = {
    Accept: "application/json",
  }

  const token = req.cookies.get("vbs_session")?.value
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const incomingCookie = req.headers.get("cookie")
  if (incomingCookie) {
    headers.Cookie = incomingCookie
  }

  return headers
}

export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    const upstream = await fetch(UPSTREAM, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    const text = await upstream.text()

    let data: any
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = { raw: text }
    }

    const res = NextResponse.json(data, { status: upstream.status })

    return res
  } catch (err: any) {
    console.error("[parent/students proxy] error", err)
    return NextResponse.json(
      { items: [], count: 0, error: "Proxy error" },
      { status: 500 }
    )
  }
}
