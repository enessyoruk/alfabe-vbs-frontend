// app/api/_utils/proxy.ts
import { NextResponse, NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE || process.env.NEXT_PUBLIC_API_BASE || ""

/** Upstream URL birleştirici */
export function u(path: string) {
  return `${BACKEND_API_BASE}${path.startsWith("/") ? "" : "/"}${path}`
}

/** no-store cache başlıkları */
export function noStore<T extends NextResponse>(res: T): T {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

/** Güvenli JSON okuma */
export async function readJson(res: Response) {
  const text = await res.text()
  try { return text ? JSON.parse(text) : {} } catch { return text ? { message: text } : {} }
}

/** "Set-Cookie" başlıklarından sadece name=value çiftlerini çıkar (virgülleri bozmaz) */
export function extractCookiePairsFromSetCookie(upstream: Response): string[] {
  const anyUp = upstream as any
  if (typeof anyUp?.headers?.getSetCookie === "function") {
    const arr = anyUp.headers.getSetCookie() as string[] | undefined
    if (Array.isArray(arr)) {
      return arr
        .map(line => (line || "").split(";")[0]?.trim())
        .filter(Boolean) as string[]
    }
  }
  // Tek header string olabilir (virgüller "expires" yüzünden var, o yüzden naive split yapma)
  const raw = upstream.headers.get("set-cookie")
  if (!raw) return []
  // Birden fazla Set-Cookie tek stringte birleşmiş olsa bile RFC gereği virgülle ayrılır; ancak expires da virgül içerir.
  // Güvenli yaklaşım: RegExp ile her cookie’nin name=value başlangıcını yakala.
  const results: string[] = []
  const rx = /(^|,)\s*([^=\s;]+=[^;,\r\n]+)/g
  let m: RegExpExecArray | null
  while ((m = rx.exec(raw)) !== null) {
    const pair = m[2]?.trim()
    if (pair) results.push(pair)
  }
  return results
}

/** İstemciden gelen Cookie ile `vbs_backend` içindekileri birleştirip upstream’e gönder */
export function buildUpstreamHeadersFromRequest(req: NextRequest) {
  const headers: Record<string, string> = { Accept: "application/json" }

  // (Opsiyonel) Authorization: Bearer forward
  const authHeader = req.headers.get("authorization") || ""
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    headers.Authorization = authHeader
  }

  // İstemciden gelen tüm cookie’ler (gerekli olabilir)
  const incoming = req.headers.get("cookie") || ""

  // Girişte sakladığımız backend cookie çiftleri
  const vault = req.cookies.get("vbs_backend")?.value
  const backendPairs = vault ? decodeURIComponent(vault) : ""

  // Birleştir (aynı isimli varsa backendPairs’i öne al)
  const merged = mergeCookiePairs(incoming, backendPairs)
  if (merged) headers.Cookie = merged

  return headers
}

/** "a=1; b=2" + "c=3; a=9" -> "a=9; b=2; c=3" (sonraki kazanır) */
function mergeCookiePairs(a: string, b: string) {
  const map = new Map<string, string>()
  const put = (source: string) => {
    source.split(";").forEach(seg => {
      const s = seg.trim()
      if (!s) return
      const eq = s.indexOf("=")
      if (eq <= 0) return
      const name = s.slice(0, eq).trim()
      const val = s.slice(eq + 1).trim()
      if (name) map.set(name, val)
    })
  }
  // öncelik: b (backendPairs) -> a (incoming)
  if (a) put(a)
  if (b) put(b)
  // backendPairs kazansın istiyorsak sıralamayı b sonra a okuyacak şekilde değiştir:
  // put(a); put(b);

  const out = Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join("; ")
  return out || ""
}
