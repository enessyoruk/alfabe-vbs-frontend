// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// Backend API base
const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND_API_BASE) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

// No-store helper
function noStore(resp: NextResponse) {
  resp.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  resp.headers.set("Pragma", "no-cache")
  resp.headers.set("Expires", "0")
  return resp
}

function isValidEmail(v: unknown) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function isValidPassword(v: unknown) {
  return typeof v === "string" && v.length >= 3 && v.length <= 128
}

// =============================
// POST /api/auth/login
// =============================
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json().catch(() => ({}))

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta girin." }, { status: 400 })
    }
    if (!isValidPassword(password)) {
      return NextResponse.json({ error: "Şifre en az 3 karakter olmalı." }, { status: 400 })
    }

    // ----- Backend'e login isteği -----
    const url = `${BACKEND_API_BASE}/api/vbs/auth/login`

    const upstream = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email: String(email).trim(), password }),
    })

    const raw = await upstream.text()
    let data: any = {}

    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = {}
    }

    // ----- Login başarısız -----
    if (!upstream.ok) {
      const msg = data?.error || `Giriş başarısız (HTTP ${upstream.status})`
      const resp = NextResponse.json({ error: msg }, { status: upstream.status })
      const ra = upstream.headers.get("Retry-After")
      if (ra) resp.headers.set("Retry-After", ra)
      return noStore(resp)
    }

    // ----- Beklenen format yoksa -----
    if (!data?.token || !data?.user) {
      return noStore(
        NextResponse.json(
          { error: "Beklenmeyen yanıt formatı (token veya user eksik)." },
          { status: 502 },
        ),
      )
    }

    const token = data.token
    const user = data.user

    // FE → localStorage'a yazacak, biz burada sadece FE'ye döneceğiz
    // Cookie YOK, Session YOK — tamamen Bearer model

    return noStore(
      NextResponse.json({
        token,
        user
      })
    )
  } catch (err) {
    return noStore(
      NextResponse.json(
        { error: "Sunucu hatası" },
        { status: 500 },
      )
    )
  }
}

// GET kaldırıldı → Bearer modelde gereksiz
