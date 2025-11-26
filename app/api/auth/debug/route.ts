// app/api/auth/debug/route.ts
import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

export const runtime = "nodejs"

function ok<T>(data: T, init?: number) {
  const res = NextResponse.json({ ok: true, ...data }, { status: init ?? 200 })
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}
function fail(msg: string, status = 400) {
  const res = NextResponse.json({ ok: false, error: msg }, { status })
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get("vbs_session")?.value || null
    const role = req.cookies.get("vbs_role")?.value || null
    const auth = req.cookies.get("vbs_auth")?.value || null

    let payload: any = null
    let verified = false
    if (session) {
      try {
        const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "")
        const { payload: p } = await jwtVerify(session, secret)
        payload = p
        verified = true
      } catch (e: any) {
        payload = { verifyError: e?.message || "verify failed" }
      }
    }

    return ok({
      cookies: { has_vbs_session: !!session, vbs_role: role, vbs_auth: auth },
      verified,
      claims: payload,
      url: req.nextUrl.href,
    })
  } catch (e: any) {
    return fail(e?.message || "debug error", 500)
  }
}
