// app/api/teacher/homework/route.ts
import { type NextRequest, NextResponse } from "next/server"

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


const UPSTREAM_PATH = "/api/vbs/teacher/homework"

const u = (p: string) => `${BACKEND_API_BASE}${p.startsWith("/") ? "" : "/"}${p}`

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

async function readJson(r: Response) {
  const t = await r.text()
  try {
    return t ? JSON.parse(t) : {}
  } catch {
    return t ? { message: t } : {}
  }
}

export async function GET(req: NextRequest) {
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    }

    const authHeader = req.headers.get("authorization") || ""
    const cookieToken = req.cookies.get("authToken")?.value

    if (authHeader.toLowerCase().startsWith("bearer ")) {
      headers.Authorization = authHeader
    } else if (cookieToken) {
      headers.Authorization = `Bearer ${cookieToken}`
    }

    const incomingCookie = req.headers.get("cookie")
    if (incomingCookie) {
      headers.Cookie = incomingCookie
    }

    const url = new URL(req.url)
    const upstreamUrl = new URL(u(UPSTREAM_PATH))

    url.searchParams.forEach((value, key) => {
      upstreamUrl.searchParams.set(key, value)
    })

    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers,
    })

    const data = await readJson(upstreamRes)

    const res = NextResponse.json(data, {
      status: upstreamRes.status,
    })

    const retryAfter = upstreamRes.headers.get("Retry-After")
    if (retryAfter) {
      res.headers.set("Retry-After", retryAfter)
    }

    return noStore(res)
  } catch (error) {
    console.error("[proxy] /api/teacher/homework GET", error)
    return noStore(
      NextResponse.json(
        {
          error: "Sunucu hatası",
        },
        { status: 500 },
      ),
    )
  }
}
