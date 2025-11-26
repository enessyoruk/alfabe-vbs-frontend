// app/api/auth/verify/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

export const runtime = "nodejs"

function requiredEnv(name: string): string {
  const val = process.env[name]
  if (!val || !val.trim()) {
    throw new Error(`Missing env: ${name}`)
  }
  return val
}

const SESSION_SECRET = requiredEnv("SESSION_SECRET")

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("vbs_session")?.value
    if (!token) {
      return noStore(NextResponse.json({ ok: false, error: "Oturum yok" }, { status: 401 }))
    }

    const secret = new TextEncoder().encode(SESSION_SECRET)
    const { payload } = await jwtVerify(token, secret)

    const user = {
      id: payload.sub as string | undefined,
      email: (payload as any).email as string | undefined,
      name: (payload as any).name as string | undefined,
      roles: (payload as any).roles as string[] | undefined,
    }

    return noStore(NextResponse.json({ ok: true, user }, { status: 200 }))
  } catch {
    return noStore(
      NextResponse.json(
        { ok: false, error: "Geçersiz/expired oturum" },
        { status: 401 },
      ),
    )
  }
}
