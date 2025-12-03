import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

const UPSTREAM = `${BACKEND}/api/vbs/parent/payments`

async function readJson(r: Response) {
  const txt = await r.text()
  try {
    return txt ? JSON.parse(txt) : {}
  } catch {
    return { raw: txt }
  }
}

/* ============================== */
/*            GET                 */
/* ============================== */
export async function GET(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? ""

    const upstreamUrl = new URL(UPSTREAM)
    // FE → ?studentId=... gibi query'leri backend’e aynen ilet
    req.nextUrl.searchParams.forEach((v, k) =>
      upstreamUrl.searchParams.set(k, v)
    )

    const upstream = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
      },
      cache: "no-store",
    })

    const data = await readJson(upstream)

    return new NextResponse(JSON.stringify(data), {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[parent/payments GET proxy] error:", err)
    return NextResponse.json(
      { error: "Proxy error" },
      { status: 500 }
    )
  }
}

/* ============================== */
/*            POST                */
/* ============================== */
export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? ""
    const body = await req.text()

    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      cache: "no-store",
      body,
    })

    const data = await readJson(upstream)

    return new NextResponse(JSON.stringify(data), {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[parent/payments POST proxy] error:", err)
    return NextResponse.json(
      { error: "Proxy error" },
      { status: 500 }
    )
  }
}
