// app/api/debug/cookies/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const cookies = req.cookies.getAll()

  return NextResponse.json(
    {
      ok: true,
      fromNext: cookies,
      rawCookieHeader: req.headers.get("cookie") || "",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}
