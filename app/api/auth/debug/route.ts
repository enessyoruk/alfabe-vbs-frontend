// app/api/auth/debug/route.ts
import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

export const runtime = "nodejs"

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return noStore(
        NextResponse.json({ ok: false, error: "Bearer token yok" }, { status: 401 })
      )
    }

    const token = authHeader.slice("bearer ".length).trim()
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET)

    let payload: any = null
    let verified = false

    try {
      const { payload: p } = await jwtVerify(token, secret)
      payload = p
      verified = true
    } catch (err: any) {
      payload = { verifyError: err?.message || "Token doğrulama hatası" }
    }

    return noStore(
      NextResponse.json(
        {
          ok: true,
          verified,
          claims: payload,
          rawToken: token,
          url: req.nextUrl.href,
        },
        { status: 200 }
      )
    )
  } catch (err: any) {
    return noStore(
      NextResponse.json({ ok: false, error: err?.message || "debug error" }, { status: 500 })
    )
  }
}
