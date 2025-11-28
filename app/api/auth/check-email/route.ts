// app/api/auth/check-email/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND_API_BASE) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ error: "email gerekli" }, { status: 400 })
    }

    const upstreamUrl = `${BACKEND_API_BASE}/api/vbs/auth/check-email?email=${encodeURIComponent(email)}`

    const up = await fetch(upstreamUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    })

    const body = await up.text()

    return new NextResponse(body, {
      status: up.status,
      headers: {
        "Content-Type": up.headers.get("Content-Type") || "application/json",
      },
    })
  } catch (e) {
    console.error("[proxy] /api/auth/check-email", e)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
