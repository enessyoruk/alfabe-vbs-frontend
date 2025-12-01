// app/api/vbs/parent/exams/route.ts

import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function requiredEnv(name: string): string {
  const val = process.env[name]
  if (!val || !val.trim()) {
    throw new Error(`Missing env: ${name}`)
  }
  return val
}

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND_API_BASE) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

export async function GET(req: NextRequest) {
  const upstream = `${BACKEND_API_BASE}/api/vbs/parent/exams`

  // Cookie forward
  const cookie = req.headers.get("cookie") || ""

  const up = await fetch(upstream, {
    method: "GET",
    credentials: "include",
    headers: {
      cookie,
      Accept: "application/json",
    },
  })

  const body = await up.text()

  return new Response(body, {
    status: up.status,
    headers: {
      "Content-Type": up.headers.get("Content-Type") || "application/json",
      "Cache-Control": "no-store",
    },
  })
}
