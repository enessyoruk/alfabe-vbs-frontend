// app/api/teacher/exams/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

const UPSTREAM = "/api/vbs/teacher/exams/upload-image"

export async function POST(req: NextRequest) {
  const url = `${BACKEND}${UPSTREAM}`

  try {
    // 🔥 FormData — backend'in istediği IFormFile (Image)
    const form = await req.formData()

    // Alan adı backend DTO: "Image"
    const file = form.get("image") || form.get("Image")
    if (file) {
      form.delete("image")
      form.set("Image", file as any)
    }

    const upstream = await fetch(url, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      body: form,
    })

    return upstream
  } catch (err: any) {
    return NextResponse.json(
      { error: "Upload proxy error", detail: err.message },
      { status: 500 }
    )
  }
}
