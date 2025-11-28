import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  ""

if (!BACKEND_API_BASE) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

const UPSTREAM_PATH = "/api/vbs/teacher/notifications"

const u = (p: string) =>
  `${BACKEND_API_BASE}${p.startsWith("/") ? "" : "/"}${p}`

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
  const txt = await r.text()
  try {
    return txt ? JSON.parse(txt) : {}
  } catch {
    return txt ? { message: txt } : {}
  }
}

// --- Bearer Auth Builder ---
function buildAuthHeaders(req: NextRequest) {
  const headers: Record<string, string> = {
    Accept: "application/json",
  }

  // 1) Authorization header (varsa)
  const ah = req.headers.get("authorization") || ""
  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
    return headers
  }

  // 2) vbs_session → Bearer
  const token = req.cookies.get("vbs_session")?.value
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    const upstreamUrl = new URL(u(UPSTREAM_PATH))
    req.nextUrl.searchParams.forEach((v, k) =>
      upstreamUrl.searchParams.set(k, v)
    )

    const up = await fetch(upstreamUrl.toString(), {
      method: "GET",
      cache: "no-store",
      headers,
    })

    const data = await readJson(up)

    if (up.ok) {
      const res = NextResponse.json(data, { status: 200 })
      return noStore(res)
    }

    // fallback → UI kırmasın
    const fallback = {
      items: [],
      error:
        (data as any)?.error ||
        (data as any)?.message ||
        `Teacher bildirimleri yüklenemedi (HTTP ${up.status})`,
    }

    const res = NextResponse.json(fallback, { status: 200 })
    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/teacher/notifications GET", e)
    const res = NextResponse.json(
      {
        items: [],
        error: "Teacher bildirimleri yüklenemedi.",
      },
      { status: 200 }
    )
    return noStore(res)
  }
}
