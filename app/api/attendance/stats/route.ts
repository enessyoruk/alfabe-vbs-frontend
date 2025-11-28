// app/api/attendance/stats/route.ts
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// =========================
// ENV
// =========================
const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND_API_BASE) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

const u = (p: string) =>
  `${BACKEND_API_BASE}${p.startsWith("/") ? "" : "/"}${p}`

// =========================
// NO-STORE
// =========================
function noStore(res: NextResponse) {
  res.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  )
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

// =========================
// JSON SAFE READER
// =========================
async function readJson(r: Response) {
  const t = await r.text()
  try {
    return t ? JSON.parse(t) : {}
  } catch {
    return t ? { message: t } : {}
  }
}

// =========================
// AUTH (Bearer only)
// =========================
function buildAuthHeaders(req: NextRequest) {
  const headers: Record<string, string> = { Accept: "application/json" }

  const ah = req.headers.get("authorization") || ""
  if (ah.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = ah
  }

  // ❌ Cookie forward kaldırıldı
  // ❌ authToken cookie kaldırıldı

  return headers
}

// =========================
// GET — Attendance stats
// =========================
export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    const incoming = new URL(req.url)
    const studentId = incoming.searchParams.get("studentId")

    // Parent bazı yerlerde stats'a boş vurabiliyor → default boş istatistik
    if (!studentId) {
      return noStore(
        NextResponse.json(
          {
            totalLessons: 0,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            attendanceRate: 0,
          },
          { status: 200 }
        )
      )
    }

    const upstreamUrl = new URL(
      u(`/api/vbs/parent/students/${studentId}/attendance/stats`)
    )

    // ekstra query parametreleri aynen aktar (month vs.)
    incoming.searchParams.forEach((v, k) => {
      if (k !== "studentId") upstreamUrl.searchParams.set(k, v)
    })

    const up = await fetch(upstreamUrl.toString(), {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      headers,
    })

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })

    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/attendance/stats GET", e)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    )
  }
}
