"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthBackground } from "@/components/auth/auth-background"
import { toast } from "sonner"

// -------------------------------
// Yardımcı tipler
// -------------------------------
type AnyObj = Record<string, any>

type LoginUser = {
  id: string
  email?: string
  name?: string
  roles?: string[]
  type?: string
}

type LoginResponse =
  | { user?: LoginUser; data?: { user?: LoginUser }; claims?: AnyObj; error?: string; message?: string }
  | LoginUser

// -------------------------------
// Yardımcı fonksiyonlar
// -------------------------------
function normalizeRoles(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map(r => String(r || "")).filter(r => r.trim() !== "")
}

function inferPrimaryRole(roles: string[], type?: string) {
  const lower = roles.map(r => r.toLowerCase())
  const t = (type || "").toLowerCase()

  if (lower.includes("teacher") || t === "teacher") return "Teacher"
  if (lower.includes("admin") || t === "admin") return "Admin"
  if (lower.includes("parent") || t === "parent" || lower.includes("veli")) return "Parent"

  return roles[0] || ""
}

function rolesFrom(u: LoginUser) {
  const raw = normalizeRoles(u.roles)
  const primary = inferPrimaryRole(raw, u.type)
  if (primary && !raw.includes(primary)) raw.push(primary)
  return raw
}

function setClientRoleCookies(roles: string[]) {
  const maxAge = 86400
  const primary = inferPrimaryRole(roles)

  if (primary === "Teacher")
    document.cookie = `vbs_role=Teacher; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  else if (primary === "Parent")
    document.cookie = `vbs_role=Parent; Path=/; Max-Age=${maxAge}; SameSite=Lax`

  document.cookie = `vbs_auth=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

function persistUser(u: LoginUser) {
  try {
    localStorage.setItem("vbs:user", JSON.stringify({ user: u }))
  } catch {}
}

function pickUser(r: LoginResponse | undefined): LoginUser | null {
  if (!r || typeof r !== "object") return null
  if ("user" in r && r.user) return r.user
  if ("data" in r && r.data?.user) return r.data.user
  if ("claims" in r) return { ...(r as any).claims }
  if ((r as any)?.id) return r as LoginUser
  return null
}

// ===============================================================
// PAGE COMPONENT
// ===============================================================
export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // 🔥 Logout reason mesajı
  const [logoutReasonMsg, setLogoutReasonMsg] = useState("")

  const router = useRouter()
  const sp = useSearchParams()

  // 🔥 Logout reason mesajını oku
  useEffect(() => {
    const reason = localStorage.getItem("vbs_logout_reason")

    if (reason === "timeout") {
      setLogoutReasonMsg("Oturumunuz sonlandırıldı. Lütfen yeniden giriş yapın.")
    }

    localStorage.removeItem("vbs_logout_reason")
  }, [])

  const validate = () =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password.length >= 6

  const isSafeNext = (n: string | null) =>
    n && n.startsWith("/") && !n.startsWith("//") ? n : null

  const goHome = (roles: string[]) => {
    const primary = inferPrimaryRole(roles)
    const next = isSafeNext(sp.get("next"))

    const target =
      next ||
      (primary === "Teacher"
        ? "/teacher/dashboard"
        : primary === "Parent"
        ? "/parent/dashboard"
        : "/")

    router.replace(target)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || isLoading) return
    setIsLoading(true)
    setErrorMsg("")

    try {
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const txt = await res.text()
      let data: LoginResponse | undefined
      try {
        data = txt ? JSON.parse(txt) : undefined
      } catch {}

      if (!res.ok) {
        const msg =
          (data as any)?.error ||
          (data as any)?.message ||
          "Giriş yapılamadı."
        setErrorMsg(msg)
        toast.error(msg)
        return
      }

      const user = pickUser(data)
      if (!user) {
        setErrorMsg("Kullanıcı bilgileri okunamadı.")
        return
      }

      const roles = rolesFrom(user)
      persistUser(user)
      setClientRoleCookies(roles)
      goHome(roles)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthBackground>
      <div className="w-full flex justify-center px-4">
        <div className="w-full max-w-md">

          {/* Ana Login Kutusu */}
          <div className="rounded-[32px] bg-white/80 shadow-xl border border-slate-200/70 backdrop-blur-sm px-6 py-8 sm:px-8 sm:py-10 space-y-8">

            {/* Başlık */}
            <div className="text-center space-y-1">
              <h1 className="text-primary font-bold">
                Alfa-β Akademi Bilgi Yönetim Sistemi
              </h1>
              <p className="text-xs text-muted-foreground">
                Bu ekran yalnızca <strong>Veli</strong> ve <strong>Öğretmen</strong> girişi içindir.
              </p>
            </div>

            {/* 🔥 OTURUM SONLANDIRMA MESAJI */}
            {logoutReasonMsg && (
              <div className="bg-yellow-100 text-yellow-800 border border-yellow-300 px-4 py-3 rounded-lg text-sm">
                {logoutReasonMsg}
              </div>
            )}

            {/* Hata Mesajı */}
            {errorMsg && (
              <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-3 rounded-lg text-sm">
                {errorMsg}
              </div>
            )}

            {/* Logo + Form */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-70">
                <Image
                  src="/images/design-mode/logo-alfabe-removebg-preview.png"
                  alt=""
                  width={500}
                  height={1000}
                  className="object-contain"
                />
              </div>

              <div className="relative z-10 space-y-6">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-semibold">Giriş Yap</h2>
                  <p className="text-sm text-muted-foreground">
                    E-posta adresiniz ile giriş yapın
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} noValidate className="space-y-6">

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Şifre</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Şifrenizi girin"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 rounded-xl"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 rounded-full py-6 text-sm font-semibold"
                  >
                    {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
                  </Button>

                  {/* Alt Linkler */}
                  <div className="text-center space-y-1 text-sm text-muted-foreground">
                    <p>
                      Hesabınız yok mu{" "}
                      <Link href="/register" className="text-primary hover:underline">
                        Kayıt olun
                      </Link>
                    </p>
                    <p>
                      Şifrenizi mi unuttunuz{" "}
                      <Link href="/reset-password" className="text-primary hover:underline">
                        Şifre sıfırla
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Ana sayfaya dön */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Ana sayfaya dön
            </Link>
          </div>
        </div>
      </div>
    </AuthBackground>
  )
}
