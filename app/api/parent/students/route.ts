// app/api/parent/students/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
  const t = await r.text()
  try {
    return t ? JSON.parse(t) : {}
  } catch {
    return t ? { message: t } : {}
  }
}

export async function GET(req: NextRequest) {
  try {
    // ❗ Parent backend sadece Cookie = "vbs_session=..." içerdiğinde çalışır.
    // Bu yüzden tüm gelen cookie header'ını aynen forward ediyoruz.
    const cookieHeader = req.headers.get("cookie") || ""

    const headers: Record<string, string> = {
      Accept: "application/json",
    }

    if (cookieHeader.trim() !== "") {
      headers.Cookie = cookieHeader
    }

    const search = req.nextUrl.search || ""
    const upstreamUrl = `${BACKEND}/api/vbs/parent/students${search}`

    const up = await fetch(upstreamUrl, {
      method: "GET",
      cache: "no-store",
      headers,
    })

    const data = await readJson(up)

    // Backend 2xx ise → direkt döndür
    if (up.ok) {
      const res = NextResponse.json(data, { status: 200 })
      return noStore(res)
    }

    // Backend hata dönerse → boş data ama 200
    const fallback = {
      items: [],
      count: 0,
      error:
        (data as any)?.error ||
        (data as any)?.message ||
        `Öğrenci listesi yüklenemedi (HTTP ${up.status})`,
    }

    const res = NextResponse.json(fallback, { status: 200 })
    return noStore(res)
  } catch (e) {
    console.error("[parent/students]", e)
    const res = NextResponse.json(
      {
        items: [],
        count: 0,
        error: "Beklenmeyen hata",
      },
      { status: 200 }
    )
    return noStore(res)
  }
}
