// app/api/auth/check-email/route.ts
import { NextResponse } from "next/server";
import { backendFetch, endpoints } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "email gerekli" }, { status: 400 });
    }

    const qs = `?email=${encodeURIComponent(email)}`;
    const backendRes = await backendFetch(`${endpoints.vbs.auth.checkEmail}${qs}`, { method: "GET" });
    const body = await backendRes.text();

    return new NextResponse(body, {
      status: backendRes.status,
      headers: {
        "Content-Type": backendRes.headers.get("Content-Type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
