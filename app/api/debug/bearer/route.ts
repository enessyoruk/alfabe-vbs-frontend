import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";

  const res = NextResponse.json(
    {
      ok: true,
      authHeader: auth,
      hasBearer: auth.toLowerCase().startsWith("bearer "),
      bearerToken: auth.toLowerCase().startsWith("bearer ")
        ? auth.substring(7)
        : null,
    },
    { status: 200 }
  );

  res.headers.set("Cache-Control", "no-store");
  return res;
}
