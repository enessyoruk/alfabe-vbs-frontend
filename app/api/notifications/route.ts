// app/api/notifications/route.ts
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE || process.env.NEXT_PUBLIC_API_BASE || ""

const u = (path: string) =>
  `${BACKEND_API_BASE}${path.startsWith("/") ? "" : "/"}${path}`

function noStore(res: NextResponse) {
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  )
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
  const headers: Record<string, string> = {
    Accept: "application/json",
  }

  // 1) Authorization header varsa → kullan
  const ah = req.headers.get("authorization") || ""
  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
    return headers
  }

  // 2) vbs_session → bearer token
  const token = req.cookies.get("vbs_session")?.value
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    const upstream = await fetch(u("/api/vbs/parent/notifications"), {
      method: "GET",
      cache: "no-store",
      headers,
    })

    const data = await readJson(upstream)

    if (upstream.ok) {
      const res = NextResponse.json(data, { status: 200 })
      return noStore(res)
    }

    // fallback
    const msg =
      (data as any)?.error ||
      (data as any)?.message ||
      `Bildirimler alınamadı (HTTP ${upstream.status})`

    const fallback = {
      items: [],
      count: 0,
      error: msg,
    }

    const res = NextResponse.json(fallback, { status: 200 })
    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/notifications error:", e)

    const res = NextResponse.json(
      {
        items: [],
        count: 0,
        error: "Bildirimler yüklenemedi. Lütfen tekrar deneyin.",
      },
      { status: 200 }
    )

    return noStore(res)
  }
}

export async function PUT() {
  return NextResponse.json(
    { error: "Güncelleme desteklenmiyor (backend PUT yok)" },
    { status: 405 }
  )
}
