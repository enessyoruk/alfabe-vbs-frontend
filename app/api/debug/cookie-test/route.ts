import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const cookies = req.cookies.getAll()

  return NextResponse.json({
    cookies,
    rawCookieHeader: req.headers.get("cookie") || ""
  })
}
