// app/api/vbs/teacher/exams/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

const UPSTREAM = `${BACKEND}/api/vbs/teacher/exams/upload-image`

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? ""

    // STREAM FORWARD
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        Cookie: cookieHeader,
      },
      body: req.body,               // 🔥 STREAM — asıl çözüm
      ...( { duplex: "half" } as any ),
    })

    const text = await upstream.text()
    let json: any
    try { json = JSON.parse(text) } catch { json = { raw: text } }

    return noStore(
      NextResponse.json(json, { status: upstream.status })
    )
  } catch (err: any) {
    console.error("[upload-image proxy] error", err)
    return noStore(
      NextResponse.json(
        { error: "Proxy error", detail: err.message },
        { status: 500 }
      )
    )
  }
}
