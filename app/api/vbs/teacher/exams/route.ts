// app/api/vbs/teacher/exams/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Backend base
const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

// Backend endpoint
const UPSTREAM = "/api/vbs/teacher/exams"

// no-store helper
function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

// Cookie + Authorization forward
function buildHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/json",
  }

  // HttpOnly jwt cookie → token
  const jwt = req.cookies.get("vbs_session")?.value
  if (jwt) h.Authorization = `Bearer ${jwt}`

  // Browser cookie → forward
  const ck = req.headers.get("cookie")
  if (ck) h.Cookie = ck

  return h
}

// =====================================================================
// GET
// =====================================================================
export async function GET(req: NextRequest) {
  const search = req.nextUrl.search ?? ""
  const url = `${BACKEND}${UPSTREAM}${search}`

  try {
    const headers = buildHeaders(req)

    const upstream = await fetch(url, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers,
    })

    const text = await upstream.text()
    let json: any = {}

    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { raw: text }
    }

    return noStore(
      NextResponse.json(json, { status: upstream.status })
    )
  } catch (err: any) {
    console.error("[proxy exams GET]", err)
    return noStore(
      NextResponse.json(
        { error: "Upstream GET error", detail: err.message },
        { status: 500 }
      )
    )
  }
}

// =====================================================================
// POST
// =====================================================================
export async function POST(req: NextRequest) {
  const url = `${BACKEND}${UPSTREAM}`

  try {
    const headers = buildHeaders(req)

    // Content-Type forward
    const ct = req.headers.get("content-type")
    if (ct) headers["Content-Type"] = ct

    // Body → Stream bozulmadan aktarılır
    const bodyStream = req.body as any

    const upstream = await fetch(url, {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers,
      body: bodyStream,
      ...( { duplex: "half" } as any )  // nodejs stream fix
    })

    const text = await upstream.text()
    let json: any = {}

    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      json = { raw: text }
    }

    return noStore(
      NextResponse.json(json, { status: upstream.status })
    )
  } catch (err: any) {
    console.error("[proxy exams POST]", err)
    return noStore(
      NextResponse.json(
        { error: "Upstream POST error", detail: err.message },
        { status: 500 }
      )
    )
  }
}
