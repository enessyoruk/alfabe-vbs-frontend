// lib/security.ts
import type { NextRequest } from "next/server"

/* ============================================================
   Güvenlik Konfigürasyonu
   ============================================================ */
export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_ATTEMPT_WINDOW: 15 * 60 * 1000, // 15 dk
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000,    // 24 saat (opsiyonel pseudo-token için)
  RATE_LIMIT_WINDOW: 60 * 1000,         // 1 dk
  RATE_LIMIT_MAX_REQUESTS: 60,
}

/* ============================================================
   Rate limit state (process belleğinde; edge’de kalıcı değildir)
   ============================================================ */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const loginAttemptsMap = new Map<string, { attempts: number; resetTime: number }>()

/* ============================================================
   Input doğrulama & sanitizasyon
   ============================================================ */
export const validateInput = {
  phone: (phone: string): boolean => {
    const normalized = phone.replace(/\s+/g, "").replace(/[^\d]/g, "")
    return normalized.length >= 10 && normalized.length <= 11
  },

  password: (password: string): boolean => {
    return password.length >= 3 && password.length <= 100
  },

  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  sanitizeString: (input: string): string => {
    return String(input ?? "").replace(/[<>'"]/g, "").trim()
  },

  sanitizeNumber: (input: unknown): number | null => {
    const num = Number(input)
    return Number.isFinite(num) ? num : null
  },
}

/* ============================================================
   Rate limiting
   ============================================================ */
export function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + SECURITY_CONFIG.RATE_LIMIT_WINDOW,
    })
    return { allowed: true }
  }

  if (record.count >= SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    }
  }

  record.count++
  return { allowed: true }
}

/* ============================================================
   Login attempt takibi
   ============================================================ */
export function checkLoginAttempts(identifier: string): { allowed: boolean; remainingAttempts?: number } {
  const now = Date.now()
  const record = loginAttemptsMap.get(identifier)

  if (!record || now > record.resetTime) {
    loginAttemptsMap.set(identifier, {
      attempts: 1,
      resetTime: now + SECURITY_CONFIG.LOGIN_ATTEMPT_WINDOW,
    })
    return { allowed: true, remainingAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - 1 }
  }

  if (record.attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
    return { allowed: false }
  }

  record.attempts++
  return {
    allowed: true,
    remainingAttempts: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - record.attempts,
  }
}

export function resetLoginAttempts(identifier: string): void {
  loginAttemptsMap.delete(identifier)
}

/* ============================================================
   Edge-safe helpers (base64 & random)
   ============================================================ */
function b64encode(str: string): string {
  if (typeof btoa === "function") return btoa(str)
  // Node/Edge fallback
  if (typeof Buffer !== "undefined") return Buffer.from(str, "utf-8").toString("base64")
  // Worst-case (çok nadir)
  return str
}

function b64decode(str: string): string {
  if (typeof atob === "function") return atob(str)
  if (typeof Buffer !== "undefined") return Buffer.from(str, "base64").toString("utf-8")
  return str
}

function randomNonce(len = 16): string {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(len)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("")
  }
  try {
    // Node fallback
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { randomBytes } = require("crypto")
    return randomBytes(len).toString("hex")
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }
}

/* ============================================================
   Basit (opsiyonel) token üretimi ve doğrulaması
   NOT: Sadece yardımcı amaçlıdır; gerçek güvenlik için
   backend’in verdiği httpOnly cookie/JWT kullanılmalıdır.
   ============================================================ */
export function generateSecureToken(payload: Record<string, any>): string {
  const tokenData = {
    ...payload,
    exp: Date.now() + SECURITY_CONFIG.TOKEN_EXPIRY,
    nonce: randomNonce(16),
  }
  return b64encode(JSON.stringify(tokenData))
}

export function validateToken(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    const decoded = JSON.parse(b64decode(token))

    if (!decoded.exp || decoded.exp < Date.now()) {
      return { valid: false, error: "Token expired" }
    }

    // İsteğe bağlı alanlar: userId / userType yerine cookie ile gidiyoruz.
    return { valid: true, payload: decoded }
  } catch {
    return { valid: false, error: "Invalid token format" }
  }
}

/* ============================================================
   İstekten oturum/cookie okuma
   - Öncelik: Authorization Bearer
   - Cookie: vbs_auth (oturum var/yok), vbs_role (Teacher/Parent)
   ============================================================ */
export function extractToken(req: NextRequest): string | null {
  // 1) Authorization: Bearer x
  const authHeader = req.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }
  // 2) Cookie (bizim yapımız)
  const session = req.cookies.get("vbs_auth")?.value
  return session || null
}

export function extractRole(req: NextRequest): string | null {
  return req.cookies.get("vbs_role")?.value || null
}

/* ============================================================
   Yetkilendirme yardımcıları
   ============================================================ */
/** String türü tekil userType için basit kontrol (geriye dönük) */
export function checkAuthorization(userType: string, allowedTypes: string[]): { authorized: boolean; error?: string } {
  if (!allowedTypes.includes(userType)) {
    return { authorized: false, error: "Insufficient permissions" }
  }
  return { authorized: true }
}

/** Roller listesi ile kontrol: ör. roles=["Teacher"] allowed=["Teacher"] */
export function checkRoles(roles: string[] | undefined | null, allowed: string[]): { authorized: boolean; error?: string } {
  if (!roles || roles.length === 0) return { authorized: false, error: "No roles" }
  const ok = roles.some(r => allowed.includes(r))
  return ok ? { authorized: true } : { authorized: false, error: "Insufficient permissions" }
}

/* ============================================================
   Hata sanitizasyonu
   ============================================================ */
export function sanitizeError(error: unknown, isDevelopment = false): string {
  if (isDevelopment) {
    return error instanceof Error ? error.message : String(error)
  }
  return "Bir hata oluştu. Lütfen tekrar deneyin."
}

/* ============================================================
   Rate limit için istemci kimliği
   ============================================================ */
export function getClientIdentifier(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")
  const ip = fwd ? fwd.split(",")[0]?.trim() : (req.headers.get("x-real-ip") || "unknown")
  return ip
}

/* ============================================================
   İstek gövdesi alan kontrolü
   ============================================================ */
export function validateRequestBody(
  body: any,
  requiredFields: string[]
): { valid: boolean; missing?: string[] } {
  const missing = requiredFields.filter((field) => body?.[field] == null || body?.[field] === "")
  if (missing.length > 0) {
    return { valid: false, missing }
  }
  return { valid: true }
}
