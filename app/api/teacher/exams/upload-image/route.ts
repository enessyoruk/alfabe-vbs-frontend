import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

const UPSTREAM_PATH = "/api/vbs/teacher/exams/upload-image"

const buildUrl = (p: string) =>
  `${BACKEND}${p.startsWith("/") ? "" : "/"}${p}`

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

function buildAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  }

  // ✔ DOĞRU COOKIE → Backend bunu istiyor
  const jwtCookie = req.cookies.get("vbs_session")?.value
  if (jwtCookie) {
    headers.Authorization = `Bearer ${jwtCookie}`
  }

  // ✔ Manuel Cookie forward (classes route ile aynı davranış)
  const incomingCookie = req.headers.get("cookie")
  if (incomingCookie) {
    headers.Cookie = incomingCookie
  }

  return headers
}

async function readJson(r: Response) {
  const t = await r.text()
  try {
    return t ? JSON.parse(t) : {}
  } catch {
    return t ? { message: t } : {}
  }
}

export async function POST(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    // form-data forward
    const formData = await req.formData()
    const upstreamForm = new FormData()
    for (const [key, value] of formData.entries()) {
      upstreamForm.append(key, value as any)
    }

    const upstream = await fetch(buildUrl(UPSTREAM_PATH), {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers,
      body: upstreamForm,
    })

    const data = await readJson(upstream)
    const res = NextResponse.json(data, { status: upstream.status })

    const ra = upstream.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (e) {
    console.error("[proxy] POST /api/teacher/exams/upload-image error:", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}
