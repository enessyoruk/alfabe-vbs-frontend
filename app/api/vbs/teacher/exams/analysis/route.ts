// app/api/vbs/teacher/exams/analysis/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

const UPSTREAM = `${BACKEND}/api/vbs/teacher/exams/analysis`

export async function POST(req: NextRequest) {
  try {
    // Tarayıcıdan gelen cookie'yi backend'e aynen forward ediyoruz
    const cookieHeader = req.headers.get("cookie") ?? ""
    const payload = await req.json()

    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(payload),
      // güvenlik için
      cache: "no-store",
    })

    const text = await upstream.text()
    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }

    return NextResponse.json(data, { status: upstream.status })
  } catch (err: any) {
    console.error("[analysis proxy] error", err)
    return NextResponse.json(
      { error: "Proxy error", detail: err.message },
      { status: 500 }
    )
  }
}
