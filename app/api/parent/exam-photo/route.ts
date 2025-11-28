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
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  // ----- AUTH -----
  const headers: Record<string, string> = {
    Accept: "*/*",
  }

  const ah = req.headers.get("authorization") || ""
  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
  } else {
    const token = req.cookies.get("vbs_session")?.value
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const rawCookie = req.headers.get("cookie")
  if (rawCookie) headers.Cookie = rawCookie

  // ----- FETCH UPSTREAM -----
  const upstream = await fetch(fileUrl, {
    method: "GET",
    credentials: "include",
    headers,
  })

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "")
    return NextResponse.json(
      { error: text || "Fotoğraf çekilemedi" },
      { status: upstream.status }
    )
  }

  const arrayBuffer = await upstream.arrayBuffer()

  // NextResponse ile binary response gönder
  const res = new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "image/jpeg",
      "Content-Disposition": "inline",
    },
  })

  return noStore(res)
}
