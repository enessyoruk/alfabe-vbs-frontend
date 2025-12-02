// app/api/vbs/teacher/exams/analysis/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

const UPSTREAM = "/api/vbs/teacher/exams/analysis"

export async function POST(req: NextRequest) {
  const url = `${BACKEND}${UPSTREAM}`

  try {
    // JSON payload otomatik
    const json = await req.json()

    const upstream = await fetch(url, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify(json),
      headers: {
        "Content-Type": "application/json",
      },
    })

    return upstream
  } catch (err: any) {
    return NextResponse.json(
      { error: "Analysis proxy error", detail: err.message },
      { status: 500 }
    )
  }
}
