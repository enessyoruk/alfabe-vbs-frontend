"use server"

import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  ""

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

async function readJson(r: Response) {
  const txt = await r.text()
  try {
    return txt ? JSON.parse(txt) : {}
  } catch {
    return txt ? { message: txt } : {}
  }
}

export async function GET(req: NextRequest) {
  try {
    const headers: Record<string, string> = {
      Accept: "application/json"
    }

    // 🔥 Gelen tüm çerezleri taşı
    const rawCookie = req.headers.get("cookie")
    if (rawCookie) {
      headers.Cookie = rawCookie
    }

    const upstream = await fetch(`${BACKEND}/api/vbs/parent/students`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers
    })

    const data = await readJson(upstream)

    const res = NextResponse.json(
      upstream.ok
        ? data
        : { items: [], count: 0, error: "Backend error" },
      { status: 200 }
    )

    return noStore(res)
  } catch (e) {
    console.error("[proxy] /parent/students", e)
    const res = NextResponse.json(
      { items: [], count: 0, error: "Sunucu hatası" },
      { status: 200 }
    )
    return noStore(res)
  }
}
