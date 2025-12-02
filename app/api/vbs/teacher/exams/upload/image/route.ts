// app/api/vbs/teacher/exams/upload/image/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

const UPSTREAM = `${BACKEND}/api/vbs/teacher/exams/upload/image`

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? ""
    const form = await req.formData()

    const file = form.get("image") || form.get("Image")
    if (!file) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 400 }
      )
    }

    const clean = new FormData()
    clean.append("Image", file as any)

    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        Cookie: cookieHeader,
      },
      body: clean,
    })

    const text = await upstream.text()
    let json: any = {}

    try {
      json = JSON.parse(text)
    } catch {
      json = { raw: text }
    }

    return NextResponse.json(json, { status: upstream.status })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Proxy error", detail: err.message },
      { status: 500 }
    )
  }
}
