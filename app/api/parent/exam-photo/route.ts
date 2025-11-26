import { NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fileUrl = searchParams.get("url")

  if (!fileUrl) {
    return new Response("Missing url", { status: 400 })
  }

  // Parent'ın HttpOnly cookie'sini backend'e forward et
  const cookie = req.headers.get("cookie") || ""

  const upstream = await fetch(fileUrl, {
    method: "GET",
    credentials: "include",
    headers: {
      cookie,
      Accept: "*/*",
    },
  })

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "")
    return new Response(
      text || "Fotoğraf çekilemedi",
      { status: upstream.status }
    )
  }

  const arrayBuffer = await upstream.arrayBuffer()

  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "image/jpeg",
      "Content-Disposition": "attachment",
      "Cache-Control": "no-store",
    },
  })
}
