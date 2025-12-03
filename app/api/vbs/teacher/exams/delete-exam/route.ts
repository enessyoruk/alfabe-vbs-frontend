// app/api/vbs/teacher/exams/delete-exam/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

const u = (p: string) =>
  `${BACKEND}${p.startsWith("/") ? "" : "/"}${p}`

async function readJson(r: Response) {
  const t = await r.text()
  try { return t ? JSON.parse(t) : {} }
  catch { return { raw: t } }
}

function buildAuthHeaders(req: NextRequest) {
  const headers: any = { Accept: "application/json" }

  const token = req.cookies.get("vbs_session")?.value
  if (token) headers.Authorization = `Bearer ${token}`

  const cookie = req.headers.get("cookie")
  if (cookie) headers.Cookie = cookie

  return headers
}

export async function DELETE(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    // BACKEND’DEKİ YENİ DELETE ROUTE
    const upstreamUrl = new URL(
      u("/api/vbs/teacher/exams/general/delete")
    )

    req.nextUrl.searchParams.forEach((v, k) =>
      upstreamUrl.searchParams.set(k, v)
    )

    const up = await fetch(upstreamUrl.toString(), {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
      headers
    })

    const data = await readJson(up)
    return NextResponse.json(data, { status: up.status })
  } catch (err: any) {
    return NextResponse.json(
      { error: "delete proxy error", detail: err.message },
      { status: 500 }
    )
  }
}
