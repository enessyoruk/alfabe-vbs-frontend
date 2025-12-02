import { NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Backend domain'i server-side ENV'den okuyoruz
const BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

export async function GET(req: NextRequest) {
  try {
    const path = req.nextUrl.searchParams.get("path")
    if (!path) {
      return new Response("missing path", { status: 400 })
    }

    // Backend üzerindeki gerçek dosya URL'i
    const url = `${BASE}${path}`

    const upstream = await fetch(url)

    if (!upstream.ok) {
      return new Response("File not found", { status: 404 })
    }

    const arrBuf = await upstream.arrayBuffer()

    // Dosya adını path'ten çıkarıyoruz
    const fileName = path.split("/").pop() ?? "download.jpg"

    return new Response(arrBuf, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      }
    })
  } catch (err: any) {
    return new Response("download error: " + err.message, {
      status: 500
    })
  }
}
