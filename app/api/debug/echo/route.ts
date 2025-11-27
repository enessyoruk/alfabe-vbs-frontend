import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookies = req.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
  const raw = req.headers.get("cookie") || "";

  return NextResponse.json({
    cookies,
    rawCookieHeader: raw
  });
}
