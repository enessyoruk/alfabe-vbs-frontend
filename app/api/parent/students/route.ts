// app/api/parent/students/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  ""

// Ortak no-store
function noStore(res: NextResponse) {
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  )
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

// JSON parse helper
async function readJson(up: Response) {
  const raw = await up.text()
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return raw ? { message: raw } : {}
  }
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.search || ""

    // -----------------------------
    // 🔥 Cookie Header Hazırlama
    // -----------------------------
    const headers: Record<string, string> = {
      Accept: "application/json",
    }

    // 1) Next cookies → Cookie header
    const allCookies = req.cookies.getAll()
    if (allCookies.length > 0) {
      headers["Cookie"] = allCookies
        .map((c) => `${c.name}=${c.value}`)
        .join("; ")
    }

    // 2) Orijinal cookie header (varsa)
    const rawCookie = req.headers.get("cookie")
    if (rawCookie) {
      headers["Cookie"] = rawCookie
    }

    // 3) X-Forwarded-Cookie (backend bunu da okuyor)
    if (headers["Cookie"]) {
      headers["X-Forwarded-Cookie"] = headers["Cookie"]
    }

    // 4) vbs_backend special override
    const backendCookie = req.cookies.get("vbs_backend")?.value
    if (backendCookie) {
      const decoded = decodeURIComponent(backendCookie)
      headers["Cookie"] = decoded
      headers["X-Forwarded-Cookie"] = decoded
    }

    // -----------------------------
    // 🔥 Upstream Request
    // -----------------------------
    const upstream = await fetch(
      `${BACKEND}/api/vbs/parent/students${search}`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include", // 🔥 cookie forward garanti
        headers,
      }
    )

    const data = await readJson(upstream)

    // -----------------------------
    // 🔥 Başarılı ise direkt geçir
    // -----------------------------
    if (upstream.ok) {
      const res = NextResponse.json(data, { status: 200 })
      return noStore(res)
    }

    // -----------------------------
    // 🔥 Fail → Boş fallback
    // -----------------------------
    const err =
      (data as any)?.error ||
      (data as any)?.message ||
      `Öğrenci listesi yüklenemedi. (HTTP ${upstream.status})`

    const fallback = {
      items: [] as any[],
      count: 0,
      error: err,
    }

    const res = NextResponse.json(fallback, { status: 200 })
    return noStore(res)
  } catch (err) {
    console.error("[proxy] /api/parent/students error:", err)

    const res = NextResponse.json(
      {
        items: [],
        count: 0,
        error:
          "Öğrenci listesi şu anda yüklenemedi. Lütfen daha sonra tekrar deneyin.",
      },
      { status: 200 }
    )
    return noStore(res)
  }
}
