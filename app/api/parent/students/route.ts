// app/api/parent/students/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  ""

// Ortak no-store helper
function noStore(res: NextResponse) {
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  )
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

async function readJson(upstream: Response) {
  const text = await upstream.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return text ? { message: text } : {}
  }
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.search || ""

    const headers: Record<string, string> = {
  Accept: "application/json",
}

// --- FIX: NextRequest içindeki tüm çerezleri manuel Cookie header'a yaz ---
const allCookies = Array.from(req.cookies.getAll()).map(
  (c) => `${c.name}=${c.value}`
)
if (allCookies.length > 0) {
  headers.Cookie = allCookies.join("; ")
}

// Eski pattern halen kalsın (bozulmasın)
const rawCookieHeader = req.headers.get("cookie") || ""
if (rawCookieHeader && !headers.Cookie) {
  headers.Cookie = rawCookieHeader
}

// vbs_backend override'ı dokunulmadan kalıyor ↓
const backendCookie = req.cookies.get("vbs_backend")?.value
if (backendCookie) {
  headers.Cookie = decodeURIComponent(backendCookie)
}


    const upstream = await fetch(
      `${BACKEND_API_BASE}/api/vbs/parent/students${search}`,
      {
        method: "GET",
        cache: "no-store",
        headers,
      },
    )

    const data = await readJson(upstream)

    if (upstream.ok) {
      const res = NextResponse.json(data, { status: 200 })
      return noStore(res)
    }

    const messageFromBackend =
      (data as any)?.error ||
      (data as any)?.message ||
      `Öğrenci listesi yüklenemedi. (HTTP ${upstream.status})`

    const fallback = {
      items: [] as any[],
      count: 0,
      error: messageFromBackend,
    }

    const res = NextResponse.json(fallback, { status: 200 })
    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/parent/students error:", e)
    const res = NextResponse.json(
      {
        items: [],
        count: 0,
        error:
          "Öğrenci listesi şu anda yüklenemedi. Lütfen daha sonra tekrar deneyin.",
      },
      { status: 200 },
    )
    return noStore(res)
  }
}
