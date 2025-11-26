// /lib/auth.ts
export type VbsUser = {
  id: string
  email: string
  name: string
  roles: string[] // ["Parent"] | ["Teacher"] | ["Admin"]
}

export interface User {
  id: string
  name: string
  phone?: string
  type?: "parent" | "teacher" | "admin"
  token?: string
}

const STORAGE_KEY = "vbs:user"

async function readJson<T>(res: Response): Promise<T> {
  const t = await res.text()
  try { return JSON.parse(t) as T } catch { return {} as T }
}

function mapRolesToType(roles: string[]): "admin" | "teacher" | "parent" | undefined {
  if (roles?.includes("Admin")) return "admin"
  if (roles?.includes("Teacher")) return "teacher"
  if (roles?.includes("Parent")) return "parent"
  return undefined
}

function saveUser(u: VbsUser) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u })) } catch {}
}
function loadUser(): VbsUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return (parsed?.user ?? parsed) as VbsUser
  } catch { return null }
}
function clearUser() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

/* Görsel amaçlı non-HttpOnly cookie’ler (middleware bunları KULLANMIYOR) */
function setCookie(name: string, value: string, maxAgeSec: number) {
  const isHttps = typeof window !== "undefined" && window.location?.protocol === "https:"
  const secure = isHttps ? "; Secure" : ""
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax${secure}`
}
function deleteCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`
}

export function setSession(user: VbsUser) {
  saveUser(user)
  const oneWeek = 60 * 60 * 24 * 7
  const role = user.roles?.includes("Teacher") ? "Teacher" : user.roles?.includes("Parent") ? "Parent" : ""
  setCookie("vbs_auth", "1", oneWeek) // sadece UI kolaylığı
  if (role) setCookie("vbs_role", role, oneWeek)
}

export function clearSession() {
  clearUser()
  deleteCookie("vbs_auth")
  deleteCookie("vbs_role")
}

export const authService = {
  async login(emailInput: string, password: string, _userType?: "parent" | "teacher" | "admin"): Promise<VbsUser & { type?: User["type"] }> {
    const email = emailInput?.trim()

    // 🔁 ÖNEMLİ: Proxy edilen Next.js route’u kullan
    const res = await fetch(`/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await readJson<{ user?: VbsUser; error?: string }>(res)
    if (!res.ok) throw new Error(data?.error || `Giriş bilgileri hatalı (HTTP ${res.status})`)
    if (!data?.user) throw new Error("Geçersiz yanıt: kullanıcı bilgisi yok")

    setSession(data.user)
    const type = mapRolesToType(data.user.roles)
    return { ...data.user, type }
  },

  logout: async (): Promise<void> => {
    clearSession()
    // backend vbs_session’ı temizlemeyi Next.js proxy ile de yapabiliriz (gerekirse ekleriz)
    return
  },

  getCurrentUser(): (VbsUser & { type?: User["type"] }) | null {
    const u = loadUser()
    if (!u) return null
    const type = mapRolesToType(u.roles)
    return { ...u, type }
  },

  async getCurrentUserAsync(): Promise<(VbsUser & { type?: User["type"] }) | null> {
    return this.getCurrentUser()
  },

  isAuthenticated(): boolean {
    if (loadUser()) return true
    if (typeof document !== "undefined") {
      return document.cookie.split(";").some(c => c.trim().startsWith("vbs_auth="))
    }
    return false
  },

  async isAuthenticatedAsync(): Promise<boolean> {
    if (this.isAuthenticated()) return true
    return false
  },

  getUserType(): User["type"] | null {
    const u = loadUser()
    return u ? mapRolesToType(u.roles) ?? null : null
  },

  getRoles(): string[] {
    return loadUser()?.roles ?? []
  },

  hasRole(role: "Admin" | "Teacher" | "Parent"): boolean {
    return this.getRoles().includes(role)
  },

  async checkEmail(email: string): Promise<{ available: boolean }> {
    // (aynen bırakıyoruz; gerekirse ayrı proxy ekleriz)
    const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE}/api/vbs/auth/check-email`)
    url.searchParams.set("email", email.trim().toLowerCase())
    const res = await fetch(url.toString(), { method: "GET", credentials: "include", mode: "cors" })
    if (res.status === 409) return { available: false }
    try {
      const data = await res.json()
      return { available: !!data?.available }
    } catch { return { available: false } }
  },

  async register(payload: {
    name: string
    phoneNumber: string
    email: string
    password: string
    userType: "parent" | "teacher"
  }): Promise<{ message: string }> {
    const res = await fetch(`/api/auth/register`, { // istersen bunu da proxyye alırız; şimdilik direkt backend’e de gidebilir
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await readJson<{ message?: string; error?: string }>(res)
    if (!res.ok) throw new Error(data?.error || `Kayıt başarısız (HTTP ${res.status})`)
    return { message: data?.message || "Başvuru alındı." }
  },
}
