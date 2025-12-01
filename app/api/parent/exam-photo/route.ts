import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fileUrl = searchParams.get("url")

  if (!fileUrl) {
    return new Response("Missing url", { status: 400 })
  }

  // ---- AUTH (Doğru sıra) ----
  const headers: Record<string, string> = {
    Accept: "*/*",
  }

  // 1) Authorization header varsa → kullan
  const ah = req.headers.get("authorization") || ""
  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
  } else {
    // 2) Fallback → vbs_session → Bearer
    const token = req.cookies.get("vbs_session")?.value
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  // 3) Cookie forward (bazı backend'ler buna ihtiyaç duyuyor)
  const rawCookie = req.headers.get("cookie")
  if (rawCookie) headers.Cookie = rawCookie

  // ---- Upstream fetch ----
  const upstream = await fetch(fileUrl, {
    method: "GET",
    credentials: "include",
    headers,
  })

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "")
    return new Response(
      text || "Fotoğraf çekilemedi",
      { status: upstream.status }
    )
  }

  const arrayBuffer = await upstream.arrayBuffer()

  const res = new Response(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "image/jpeg",
      "Content-Disposition": "inline",
    },
  })

  return noStore(res)
}
