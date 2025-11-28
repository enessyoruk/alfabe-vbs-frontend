// app/api/parent/guidance-notes/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

const UPSTREAM = "/api/vbs/parent/guidance"

const u = (path: string) =>
  `${BACKEND}${path.startsWith("/") ? "" : "/"}${path}`

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
  try { return t ? JSON.parse(t) : {} }
  catch { return t ? { message: t } : {} }
}

// ---------------- AUTH STANDARD ----------------
function buildAuthHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" }

  // 1) Authorization header varsa → öncelikli
  const ah = req.headers.get("authorization") || ""
  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
  } else {
    // 2) Cookie → vbs_session → fallback Bearer
    const token = req.cookies.get("vbs_session")?.value
    if (token) headers.Authorization = `Bearer ${token}`
  }

  // Cookie forward
  const raw = req.headers.get("cookie")
  if (raw) headers.Cookie = raw

  return headers
}

// ---------------- GET ----------------
export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    // Query param forward
    const upstreamUrl = new URL(u(UPSTREAM))
    req.nextUrl.searchParams.forEach((v, k) =>
      upstreamUrl.searchParams.set(k, v)
    )

    const up = await fetch(upstreamUrl.toString(), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers,
    })

    if (up.status === 404) {
      const res = NextResponse.json({ items: [] }, { status: 200 })
      return noStore(res)
    }

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })

    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)

  } catch (e) {
    console.error("[proxy] /api/parent/guidance-notes", e)
    return noStore(
      NextResponse.json(
        {
          items: [],
          error: "Rehberlik notları şu anda yüklenemedi. Lütfen sonra tekrar deneyin.",
        },
        { status: 200 }
      )
    )
  }
}
