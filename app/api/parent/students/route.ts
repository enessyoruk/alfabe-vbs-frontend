// app/api/parent/students/route.ts
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
    // TARAYICIDAN GELEN COOKIE → VAR
    const token = req.cookies.get("vbs_session")?.value || ""
    const rawCookie = req.headers.get("cookie") || ""

    const headers: Record<string, string> = {
      Accept: "application/json",
    }

    // (1) JWT → AUTH HEADER
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    // (2) COOKIE → BACKEND'E FORWARD
    if (rawCookie) {
      headers.Cookie = rawCookie
    } else if (token) {
      headers.Cookie = `vbs_session=${token}`
    }

    const upstream = await fetch(
      `${BACKEND}/api/vbs/parent/students`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers,
      }
    )

    const data = await readJson(upstream)

    return noStore(
      NextResponse.json(
        upstream.ok
          ? data
          : { items: [], count: 0 },
        { status: 200 }
      )
    )

  } catch (err) {
    console.error("proxy /parent/students", err)
    return noStore(
      NextResponse.json(
        { items: [], count: 0, error: "Sunucu hatası" },
        { status: 200 }
      )
    )
  }
}
