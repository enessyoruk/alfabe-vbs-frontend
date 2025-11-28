// app/api/auth/verify/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

export const runtime = "nodejs"

function requiredEnv(name: string): string {
  const v = process.env[name]
  if (!v || !v.trim()) throw new Error(`Missing env: ${name}`)
  return v
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
    // ----------------------------
    // 1) Authorization header
    // ----------------------------
    const auth = req.headers.get("authorization") || ""
    if (!auth.toLowerCase().startsWith("bearer ")) {
      return noStore(
        NextResponse.json(
          { ok: false, error: "Bearer token yok" },
          { status: 401 }
        )
      )
    }

    const token = auth.substring(7).trim()
    if (!token) {
      return noStore(
        NextResponse.json(
          { ok: false, error: "Token boş" },
          { status: 401 }
        )
      )
    }

    // ----------------------------
    // 2) Verify JWT
    // ----------------------------
    const secret = new TextEncoder().encode(SESSION_SECRET)
    const { payload } = await jwtVerify(token, secret)

    const user = {
      id: payload.sub as string | undefined,
      email: (payload as any).email,
      name: (payload as any).name,
      roles: (payload as any).roles ?? [],
    }

    return noStore(
      NextResponse.json(
        { ok: true, user },
        { status: 200 }
      )
    )

  } catch {
    return noStore(
      NextResponse.json(
        { ok: false, error: "Token geçersiz veya süresi dolmuş" },
        { status: 401 }
      )
    )
  }
}
