import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

const UPSTREAM = `${BACKEND_API_BASE}/api/vbs/teacher/total-students`

export async function GET(req: NextRequest) {
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    }

    // JWT cookie → backend'e forward et
    const cookie = req.headers.get("cookie")
    if (cookie) headers["Cookie"] = cookie

    const up = await fetch(UPSTREAM, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers,
    })

    const text = await up.text()
    const json = text ? JSON.parse(text) : {}

    const res = NextResponse.json(json, { status: up.status })
    res.headers.set("Cache-Control", "no-store")

    return res
  } catch (err) {
    console.error("[proxy total-students] error:", err)
    return NextResponse.json({ error: "Proxy error" }, { status: 500 })
  }
}
