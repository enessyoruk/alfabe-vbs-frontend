// app/api/parent/notifications/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE || process.env.NEXT_PUBLIC_API_BASE || ""

function u(path: string) {
  return `${BACKEND_API_BASE}${path.startsWith("/") ? "" : "/"}${path}`
}

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

async function readJson(res: Response) {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return text ? { message: text } : {}
  }
}

function buildAuthHeaders(req: NextRequest) {
  const headers: Record<string, string> = { Accept: "application/json" }

  // 1) Authorization header varsa → kullan
  const ah = req.headers.get("authorization") || ""
  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
    return headers
  }

  // 2) Cookie içinden Bearer token → vbs_session
  const cookieToken = req.cookies.get("vbs_session")?.value
  if (cookieToken) {
    headers.Authorization = `Bearer ${cookieToken}`
  }

  return headers
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.search || ""

    const headers = buildAuthHeaders(req)

    const upstream = await fetch(
      u(`/api/vbs/parent/notifications${search}`),
      {
        method: "GET",
        cache: "no-store",
        headers,
      }
    )

    const data = await readJson(upstream)

    // ✔ Backend başarılı → birebir passthrough
    if (upstream.ok) {
      const res = NextResponse.json(data, { status: 200 })
      return noStore(res)
    }

    // ❌ Backend hata → UI kırılmasın
    const messageFromBackend =
      (data as any)?.error ||
      (data as any)?.message ||
      `Bildirimler alınamadı (HTTP ${upstream.status})`

    const fallback = {
      items: [],
      count: 0,
      error: messageFromBackend,
    }

    const res = NextResponse.json(fallback, { status: 200 })
    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/parent/notifications error:", e)

    const fallback = {
      items: [],
      count: 0,
      error: "Bildirimler şu anda yüklenemedi. Lütfen tekrar deneyin.",
    }

    return noStore(
      NextResponse.json(fallback, { status: 200 })
    )
  }
}
