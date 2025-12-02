// app/api/teacher/exams/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Backend base URL
const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

// Backend endpoint
const UPSTREAM = "/api/vbs/teacher/exams"

export async function GET(req: NextRequest) {
  const search = req.nextUrl.search || ""
  const url = `${BACKEND}${UPSTREAM}${search}`

  try {
    const upstream = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      // Header eklemiyoruz — backend sadece cookie istiyor
    })

    return upstream
  } catch (err: any) {
    return NextResponse.json(
      { error: "Upstream GET error", detail: err.message },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const url = `${BACKEND}${UPSTREAM}`

  try {
    let body: any

    // FormData mı JSON mı → otomatik algıla
    const ct = req.headers.get("content-type") || ""

    if (ct.includes("form-data")) {
      body = await req.formData()
    } else {
      body = await req.json()
    }

    const upstream = await fetch(url, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      body,
    })

    return upstream
  } catch (err: any) {
    return NextResponse.json(
      { error: "Upstream POST error", detail: err.message },
      { status: 500 }
    )
  }
}
