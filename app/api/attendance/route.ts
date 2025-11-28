// app/api/attendance/route.ts
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
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
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

  // ❌ Cookie forward kaldırıldı (cookie ile işimiz yok)
  return headers
}

// =========================
// GET — Attendance list
// =========================
export async function GET(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)
    const incoming = new URL(req.url)

    const studentId = incoming.searchParams.get("studentId")
    const classId = incoming.searchParams.get("classId")

    // Parent bazı yerlerde boş sorgu atıyordu → boş başarılı dön
    if (!studentId && !classId) {
      return noStore(
        NextResponse.json({ items: [], count: 0 }, { status: 200 }),
      )
    }

    let upstreamUrl: URL

    if (studentId) {
      upstreamUrl = new URL(u(`/api/vbs/parent/students/${studentId}/attendance`))
    } else {
      upstreamUrl = new URL(u(`/api/vbs/teacher/attendance`))
      if (classId) upstreamUrl.searchParams.set("classId", classId)
    }

    // Diğer query’leri aynen kopyala
    incoming.searchParams.forEach((v, k) => {
      if (k !== "studentId" && k !== "classId") {
        upstreamUrl.searchParams.set(k, v)
      }
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
    console.error("[proxy] /api/attendance GET", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

// =========================
// POST — Teacher creates attendance
// =========================
export async function POST(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)
    headers["Content-Type"] = "application/json"

    const body = await req.text()

    const up = await fetch(u("/api/vbs/teacher/attendance"), {
      method: "POST",
      cache: "no-store",
      credentials: "include",
      headers,
      body,
    })

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })
    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/attendance POST", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}

// =========================
// PUT — Teacher updates attendance
// =========================
export async function PUT(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)
    headers["Content-Type"] = "application/json"

    const body = await req.text()

    const up = await fetch(u("/api/vbs/teacher/attendance"), {
      method: "PUT",
      cache: "no-store",
      credentials: "include",
      headers,
      body,
    })

    const data = await readJson(up)
    const res = NextResponse.json(data, { status: up.status })
    const ra = up.headers.get("Retry-After")
    if (ra) res.headers.set("Retry-After", ra)

    return noStore(res)
  } catch (e) {
    console.error("[proxy] /api/attendance PUT", e)
    return noStore(NextResponse.json({ error: "Sunucu hatası" }, { status: 500 }))
  }
}
