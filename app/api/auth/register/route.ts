// app/api/auth/register/route.ts
import { type NextRequest, NextResponse } from "next/server"

// Bu route Node.js runtime ister
export const runtime = "nodejs"

// --- Backend base URL (prod: .env üzerinden yönetin) ---
function requiredEnv(name: string): string {
  const val = process.env[name]
  if (!val || !val.trim()) {
    throw new Error(`Missing env: ${name}`)
  }
  return val
}

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE

if (!BACKEND_API_BASE) {
  throw new Error("BACKEND_API_BASE or NEXT_PUBLIC_API_BASE is not set")
}


// ======== Güvenlik / Limitler ========
const MAX_BODY_BYTES = 64 * 1024 // 64 KB
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 dk
const RATE_LIMIT_MAX = 20 // 1 dk'da en fazla 20 kayıt denemesi / IP

// Çok basit bir in-memory rate limit (prod'da Redis gibi bir store önerilir)
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

// ======== Yardımcılar ========
function normalizePhone(raw: string): string {
  return String(raw || "").replace(/\s+/g, "").replace(/\D/g, "")
}
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""))
}
function isValidPassword(pw: string): boolean {
  return typeof pw === "string" && pw.length >= 6 && pw.length <= 128
}
function isValidName(name: string): boolean {
  const n = String(name || "").trim()
  return n.length >= 2 && n.length <= 120
}
function isValidUserType(t: unknown): t is "parent" | "teacher" {
  return t === "parent" || t === "teacher"
}

async function forwardResponse(upstream: Response) {
  // JSON ya da düz metni şeffafça ilet
  const text = await upstream.text()
  const contentType =
    upstream.headers.get("Content-Type") ||
    (text && text.trim().startsWith("{") ? "application/json" : "text/plain; charset=utf-8")

  const res = new NextResponse(text || (upstream.ok ? "" : undefined), {
    status: upstream.status,
    headers: { "Content-Type": contentType },
  })

  // Set-Cookie varsa forward et (çoğu zaman register cookie setlemez ama güvenli olsun)
  const setCookie = upstream.headers.get("set-cookie")
  if (setCookie) res.headers.set("set-cookie", setCookie)

  // Rate limit başlıkları (Retry-After) varsa ilet
  const retryAfter = upstream.headers.get("Retry-After")
  if (retryAfter) res.headers.set("Retry-After", retryAfter)

  return res
}

// ======== POST /api/auth/register ========
// Frontend’den gelen kaydı .NET backend’e PROXY eder.
// Böylece başvurular DB’ye düşer ve admin panelinde görünür.
export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"
    const rl = checkRate(ip)
    if (!rl.allowed) {
      const res = NextResponse.json(
        { error: "Çok fazla istek. Lütfen daha sonra tekrar deneyin." },
        { status: 429 }
      )
      res.headers.set("Retry-After", String(rl.retryAfter ?? 60))
      return res
    }

    // İçerik tipi kontrolü
    const contentType = request.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type application/json olmalı." }, { status: 400 })
    }

    // Büyük gövde saldırılarına karşı korunma
    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "İstek çok büyük." }, { status: 413 })
    }

    // JSON parse
    let body: any
    try {
      body = raw ? JSON.parse(raw) : {}
    } catch {
      return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 })
    }

    // Alanları topla ve minimal doğrula
    const name = String(body?.name || "").trim()
    const phoneNumber = String(body?.phoneNumber || "").trim()
    const email = String(body?.email || "").trim().toLowerCase()
    const password = String(body?.password || "")
    const userType = body?.userType as unknown

    if (!isValidName(name)) {
      return NextResponse.json({ error: "Geçersiz ad/soyad." }, { status: 400 })
    }
    if (!phoneNumber) {
      return NextResponse.json({ error: "Telefon numarası zorunludur." }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 })
    }
    if (!isValidPassword(password)) {
      return NextResponse.json({ error: "Şifre 6–128 karakter olmalı." }, { status: 400 })
    }
    if (!isValidUserType(userType)) {
      return NextResponse.json({ error: "Geçersiz kullanıcı tipi." }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phoneNumber)
    // 10–15 hane arası (ülke kodu dâhil olabilir)
    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      return NextResponse.json({ error: "Geçersiz telefon formatı." }, { status: 400 })
    }

    // .NET backend’e ilet (server-to-server, CORS yok)
    const url = `${BACKEND_API_BASE}/api/vbs/auth/register`
    const upstream = await fetch(url, {
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
        userType, // "parent" | "teacher"
      }),
    })

    return forwardResponse(upstream)
  } catch (err) {
    console.error("[register-proxy] Hata:", err)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}

// ======== GET /api/auth/register ========
// (Opsiyonel) Admin’in bekleyen başvuruları görmesi için backend’e proxy.
// Backend’teki gerçek liste endpoint’inizi buraya koyun.
export async function GET(request: NextRequest) {
  try {
    const urlObj = new URL(request.url)
    const status = urlObj.searchParams.get("status") // pending | approved | rejected

    // Backend tarafında bu parametre destekleniyorsa ekleyelim
    const target = new URL(`${BACKEND_API_BASE}/api/vbs/auth/registrations`)
    if (status) target.searchParams.set("status", status)

    const upstream = await fetch(target.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    })

    return forwardResponse(upstream)
  } catch (err) {
    console.error("[register-proxy][GET] Hata:", err)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
