// app/api/vbs/teacher/dashboard-analytics/route.ts
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const classId = searchParams.get("classId")

  if (!classId) {
    return NextResponse.json(
      { error: "classId gereklidir." },
      { status: 400 },
    )
  }

  try {
    const base = process.env.BACKEND_API_BASE || process.env.NEXT_PUBLIC_API_BASE
    if (!base) {
      return NextResponse.json(
        { error: "BACKEND_API_BASE tanımlı değil." },
        { status: 500 },
      )
    }

    const url = `${base}/api/vbs/teacher/dashboard-analytics?classId=${encodeURIComponent(
      classId,
    )}`

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend error", status: res.status },
        { status: res.status },
      )
    }

    const data = await res.json()
    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    return NextResponse.json(
      { error: "Fetch error", details: String(err) },
      { status: 500 },
    )
  }
}
