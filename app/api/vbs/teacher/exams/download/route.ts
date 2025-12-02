// app/api/vbs/teacher/exams/download/route.ts
import { NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get("path")
    if (!path) {
      return new Response("missing path", { status: 400 })
    }

    // /uploads/... → tam backend URL
    const backendUrl = `${BASE}${path}`

    const upstream = await fetch(backendUrl)

    if (!upstream.ok) {
      return new Response("File not found", { status: 404 })
    }

    const buffer = await upstream.arrayBuffer()
    const fileName = path.split("/").pop() ?? "download.jpg"

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          upstream.headers.get("Content-Type") ??
          "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err: any) {
    return new Response("download error: " + err.message, { status: 500 })
  }
}
