// app/api/vbs/teacher/exams/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

const UPSTREAM = "/api/vbs/teacher/exams/upload-image"

const u = (p: string) =>
  `${BACKEND}${p.startsWith("/") ? "" : "/"}${p}`

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

function buildHeaders(req: NextRequest): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/json"
  }

  const jwt = req.cookies.get("vbs_session")?.value
  if (jwt) h.Authorization = `Bearer ${jwt}`

  const incomingCookie = req.headers.get("cookie")
  if (incomingCookie) h.Cookie = incomingCookie

  return h
}

async function readJson(r: Response) {
  const t = await r.text()
  try { return JSON.parse(t) } catch { return { message: t } }
}

export async function POST(req: NextRequest) {
  try {
    const headers = buildHeaders(req)

    const formData = await req.formData()
    const fd = new FormData()
    for (const [k, v] of formData.entries()) {
      fd.append(k, v as any)
    }

    const upstream = await fetch(u(UPSTREAM), {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers,
      body: fd
    })

    const data = await readJson(upstream)
    const res = NextResponse.json(data, { status: upstream.status })

    const ra = upstream.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (err) {
    console.error("[proxy] POST upload-image:", err)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}
