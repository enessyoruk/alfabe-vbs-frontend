import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fileUrl = searchParams.get("url")

    if (!fileUrl) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 })
    }

    // --- Sadece Cookie forward ---
    const cookieHeader = req.headers.get("cookie") ?? ""

    const upstream = await fetch(fileUrl, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
        Accept: "*/*",
      },
      cache: "no-store",
    })

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "")
      return NextResponse.json(
        { error: text || "Fotoğraf alınamadı" },
        { status: upstream.status }
      )
    }

    const arrayBuffer = await upstream.arrayBuffer()

    // --- Binary Response döndür ---
    const res = new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "no-store",
        "Content-Disposition": "inline",
      },
    })

    return res
  } catch (err) {
    console.error("[parent/exam-photo proxy] error", err)
    return NextResponse.json(
      { error: "Proxy error" },
      { status: 500 }
    )
  }
}
