// app/api/attendance/stats/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

async function readJson(r: Response) {
  const t = await r.text()
  try { return JSON.parse(t) } catch { return { raw: t } }
}

export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? ""
    const incoming = new URL(req.url)
    const studentId = incoming.searchParams.get("studentId")

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
      `${BACKEND}/api/vbs/parent/students/${studentId}/attendance/stats`
    )

    incoming.searchParams.forEach((v, k) => {
      if (k !== "studentId") upstreamUrl.searchParams.set(k, v)
    })

    const up = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader, // 🔥
      },
      cache: "no-store",
    })

    const data = await readJson(up)
    return noStore(NextResponse.json(data, { status: up.status }))

  } catch (e) {
    console.error("[attendance/stats] error", e)
    return noStore(
      NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
    )
  }
}
