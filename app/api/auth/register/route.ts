// app/api/auth/register/route.ts
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// ==========================================
// ENV
// ==========================================
function requiredEnv(name: string): string {
  const v = process.env[name]
  if (!v || !v.trim()) throw new Error(`Missing env: ${name}`)
  return v
}

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND_API_BASE) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}

// ==========================================
// LIMITS
// ==========================================
const MAX_BODY_BYTES = 64 * 1024
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20

const rateMap = new Map<string, { count: number; resetAt: number }>()

function checkRate(ip: string) {
  const now = Date.now()
  const rec = rateMap.get(ip)

  if (!rec || now > rec.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true }
  }
  if (rec.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((rec.resetAt - now) / 1000) }
  }

  rec.count++
  return { allowed: true }
}

// ==========================================
// HELPERS
// ==========================================
function normalizePhone(v: string): string {
  return String(v || "").replace(/\D/g, "")
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function isValidPassword(v: string) {
  return typeof v === "string" && v.length >= 6 && v.length <= 128
}

function isValidName(v: string) {
  const t = String(v || "").trim()
  return t.length >= 2 && t.length <= 120
}

function isValidUserType(t: unknown): t is "parent" | "teacher" {
  return t === "parent" || t === "teacher"
}

async function forwardResponse(up: Response) {
  const text = await up.text()

  const res = new NextResponse(text || "", {
    status: up.status,
    headers: {
      "Content-Type":
        up.headers.get("Content-Type") ||
        (text.trim().startsWith("{") ? "application/json" : "text/plain"),
    },
  })

  const retryAfter = up.headers.get("Retry-After")
  if (retryAfter) res.headers.set("Retry-After", retryAfter)

  return res
}

// ==========================================
// POST — Register Proxy
// ==========================================
export async function POST(req: NextRequest) {
  try {
    // Rate-limit
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown"

    const rl = checkRate(ip)
    if (!rl.allowed) {
      const r = NextResponse.json(
        { error: "Çok fazla istek. Lütfen tekrar deneyin." },
        { status: 429 },
      )
      r.headers.set("Retry-After", String(rl.retryAfter ?? 60))
      return r
    }

    if (!req.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type application/json olmalı." },
        { status: 400 },
      )
    }

    // Gövde kontrolü
    const raw = await req.text()
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "İstek çok büyük." }, { status: 413 })
    }

    let body: any = {}
    try {
      body = raw ? JSON.parse(raw) : {}
    } catch {
      return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 })
    }

    // Validasyon
    const name = String(body?.name || "").trim()
    const phone = String(body?.phoneNumber || "").trim()
    const email = String(body?.email || "").trim().toLowerCase()
    const password = String(body?.password || "")
    const userType = body?.userType

    if (!isValidName(name)) {
      return NextResponse.json({ error: "Geçersiz ad/soyad." }, { status: 400 })
    }
    if (!phone) {
      return NextResponse.json({ error: "Telefon zorunludur." }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta girin." }, { status: 400 })
    }
    if (!isValidPassword(password)) {
      return NextResponse.json({ error: "Şifre 6–128 karakter olmalı." }, { status: 400 })
    }
    if (!isValidUserType(userType)) {
      return NextResponse.json({ error: "Geçersiz kullanıcı tipi." }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)
    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      return NextResponse.json({ error: "Geçersiz telefon numarası." }, { status: 400 })
    }

    // Backend’e forward
    const upstream = await fetch(`${BACKEND_API_BASE}/api/vbs/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        phoneNumber: normalizedPhone,
        email,
        password,
        userType,
      }),
    })

    return forwardResponse(upstream)
  } catch (err) {
    console.error("[register-proxy] ERROR:", err)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

// ==========================================
// GET — Listeleme (opsiyonel)
// ==========================================
export async function GET(req: NextRequest) {
  try {
    const urlObj = new URL(req.url)
    const status = urlObj.searchParams.get("status")

    const target = new URL(`${BACKEND_API_BASE}/api/vbs/auth/registrations`)
    if (status) target.searchParams.set("status", status)

    const upstream = await fetch(target.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    })

    return forwardResponse(upstream)
  } catch (err) {
    console.error("[register-proxy][GET] ERROR:", err)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
