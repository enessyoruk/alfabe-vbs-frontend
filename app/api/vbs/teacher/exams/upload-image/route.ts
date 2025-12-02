// app/api/vbs/teacher/exams/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

const UPSTREAM = `${BACKEND}/api/vbs/teacher/exams/upload-image`

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? ""
    const form = await req.formData()

    // Form default: image → backend: Image
    const file = form.get("image") || form.get("Image")
    if (!file) {
      return NextResponse.json(
        { error: "File missing" },
        { status: 400 }
      )
    }

    // Yeni form: Sadece doğru key ile tekrar oluştur
    const clean = new FormData()
    clean.append("Image", file as any)

    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        Cookie: cookieHeader,
      },
      body: clean,
    })

    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err: any) {
    return NextResponse.json(
      { error: "Proxy error", detail: err.message },
      { status: 500 }
    )
  }
}
