// app/api/teacher/exams/upload-image/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:5000"

const UPSTREAM_PATH = "/api/vbs/teacher/exams/upload-image"

const buildUrl = (p: string) =>
  `${BACKEND}${p.startsWith("/") ? "" : "/"}${p}`

function noStore(res: NextResponse) {
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  )
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

async function readJson(r: Response) {
  const t = await r.text()
  try {
    return t ? JSON.parse(t) : {}
  } catch {
    return t ? { message: t } : {}
  }
}

function buildAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  }

  // ✔ VBS oturumu → vbs_session cookie → Bearer
  const jwtCookie = req.cookies.get("vbs_session")?.value
  if (jwtCookie) {
    headers.Authorization = `Bearer ${jwtCookie}`
  }

  // ✔ Tüm cookie’yi de aynen backend’e ilet
  const incomingCookie = req.headers.get("cookie")
  if (incomingCookie) {
    headers.Cookie = incomingCookie
  }

  return headers
}

// POST /api/teacher/exams/upload-image
//   → /api/vbs/teacher/exams/upload-image (backend)
export async function POST(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    // Gelen form-data'yı okuyup aynen yeni bir FormData'ya aktarıyoruz
    const formData = await req.formData()
    const upstreamForm = new FormData()

    for (const [key, value] of formData.entries()) {
      upstreamForm.append(key, value as any)
    }

    // DİKKAT: Content-Type'ı ELLE SET ETMİYORUZ
    // fetch + FormData kendi boundary’li Content-Type'ı ekliyor.
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
  } catch (err) {
    console.error("[proxy] POST /api/teacher/exams/upload-image error:", err)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    )
  }
}
