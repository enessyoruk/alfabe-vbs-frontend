// app/api/vbs/teacher/exams/delete/route.ts
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
  const h: any = { Accept: "application/json" }

  const token = req.cookies.get("vbs_session")?.value
  if (token) h.Authorization = `Bearer ${token}`

  const cookies = req.headers.get("cookie")
  if (cookies) h.Cookie = cookies

  return h
}

export async function DELETE(req: NextRequest) {
  try {
    const headers = buildAuthHeaders(req)

    const upstreamUrl = new URL(
      u("/api/vbs/teacher/exams/delete")
    )

    // id parametresini backend'e geçir
    req.nextUrl.searchParams.forEach((v, k) =>
      upstreamUrl.searchParams.set(k, v)
    )

    const up = await fetch(upstreamUrl.toString(), {
      method: "DELETE",
      headers,
      credentials: "include",
      cache: "no-store",
    })

    const data = await readJson(up)

    return NextResponse.json(data, {
      status: up.status
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: "delete proxy error", detail: err.message },
      { status: 500 }
    )
  }
}
