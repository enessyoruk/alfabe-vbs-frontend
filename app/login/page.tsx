// app/login/page.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthBackground } from "@/components/auth/auth-background"
import { toast } from "sonner"


// --------------------------------------------------------
// Helpers
// --------------------------------------------------------
type AnyObj = Record<string, any>

type LoginUser = {
  id: string
  email?: string
  name?: string
  roles?: string[]
  type?: "parent" | "teacher" | "admin" | string
}

type LoginResponse =
  | { user?: LoginUser; data?: { user?: LoginUser }; claims?: AnyObj; error?: string; message?: string }
  | LoginUser

function normalizeRoles(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((r) => (r == null ? "" : String(r)))
    .filter((r) => r.trim().length > 0)
}

function inferPrimaryRole(roles: string[], type?: string): "Teacher" | "Parent" | "Admin" | "" {
  const lower = roles.map((r) => r.toLowerCase())
  const t = (type || "").toLowerCase()

  if (lower.includes("teacher") || lower.includes("öğretmen") || t === "teacher") return "Teacher"
  if (lower.includes("admin") || t === "admin") return "Admin"
  if (lower.includes("parent") || lower.includes("veli") || t === "parent") return "Parent"

  return roles.length > 0 ? "Parent" : ""
}

function rolesFrom(u: LoginUser): string[] {
  const norm = normalizeRoles(u.roles)
  const primary = inferPrimaryRole(norm, u.type)
  if (primary && !norm.includes(primary)) norm.push(primary)
  return norm
}

function setClientRoleCookies(roles: string[]) {
  const maxAge = 60 * 60 * 24
  const primary = inferPrimaryRole(roles)

  if (primary === "Teacher") {
    document.cookie = `vbs_role=Teacher; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  } else if (primary === "Parent") {
    document.cookie = `vbs_role=Parent; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  }

  document.cookie = `vbs_auth=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`
}

function persistUser(u: LoginUser) {
  const roles = rolesFrom(u);

  const teacherNumericId = (u as any).teacherNumericId ?? null;

  const clean = {
    user: {
      id: u.id,
      email: u.email,
      name: u.name,
      roles,
      teacherNumericId
    }
  };

  try {
    localStorage.setItem("vbs:user", JSON.stringify(clean));
  } catch {}
}

function pickUser(d: LoginResponse | undefined): LoginUser | null {
  if (!d || typeof d !== "object") return null
  if ("user" in d && d.user) return d.user
  if ("data" in d && (d as any).data?.user) return (d as any).data.user
  if ("claims" in d && (d as any).claims) return { ...(d as any).claims }
  if ((d as any)?.id) return d as LoginUser
  return null
}

// --------------------------------------------------------
// Page Component
// --------------------------------------------------------
export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")    // 🔥 EKLENDİ

  const router = useRouter()
  const sp = useSearchParams()

  const validate = () =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password.length >= 6

  const isSafeNext = (val: string | null) =>
    val && val.startsWith("/") && !val.startsWith("//") ? val : null

  const hardRedirect = (path: string) => {
    if (typeof window !== "undefined") window.location.assign(path)
  }

  const goRoleHome = (roles: string[]) => {
    const primary = inferPrimaryRole(roles)
    const next = isSafeNext(sp.get("next"))

    const target =
      next ||
      (primary === "Teacher"
        ? "/teacher/dashboard"
        : primary === "Parent"
        ? "/parent/dashboard"
        : "/")

    try {
      router.replace(target)
    } catch {}

    setTimeout(() => hardRedirect(target), 20)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || isLoading) return
    setIsLoading(true)
    setErrorMsg("") // önceki mesajı sıfırla

    try {
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const raw = await res.text()
      let data: LoginResponse | undefined
      try {
        data = raw ? (JSON.parse(raw) as LoginResponse) : undefined
      } catch {}

      if (!res.ok) {
  let message = "Giriş yapılamadı."

  try {
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed?.error) message = parsed.error
    else if (parsed?.message) message = parsed.message
  } catch {}

  
  toast.error(message, {
    duration: 2500,
    position: "bottom-right",
  })

  setErrorMsg(message)
  return
}


      const user = pickUser(data)
      if (!user) {
        setErrorMsg("Kullanıcı bilgileri alınamadı.")
        return
      }

      const roles = rolesFrom(user)

      persistUser(user)
      setClientRoleCookies(roles)
      goRoleHome(roles)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthBackground>
      <div className="w-full max-w-md px-3">
        <div className="rounded-[32px] bg-white/80 shadow-xl border border-slate-200/70 backdrop-blur-sm px-6 py-8 sm:px-8 sm:py-10 space-y-8">
          
          {/* Üst başlık */}
          <div className="text-center space-y-1">
            <h1 className="text-primary font-bold">
              Alfa-β Akademi Bilgi Yönetim Sistemi
            </h1>
            <p className="text-xs text-muted-foreground">
              Bu ekran yalnızca <strong>Veli</strong> ve <strong>Öğretmen</strong> girişi içindir.
            </p>
          </div>

          {/* ❗ HATA MESAJI BLOĞU */}
          {errorMsg && (
            <div className="bg-red-100 text-red-700 border border-red-300 px-4 py-3 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}

          {/* Logo */}
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

            {/* Form */}
            <div className="relative z-10 space-y-6">
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-semibold">Giriş Yap</h2>
                <p className="text-sm text-muted-foreground">
                  E-posta adresiniz ve şifreniz ile giriş yapın
                </p>
              </div>

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
                  className="w-full bg-primary hover:bg-primary/90 rounded-full py-6 text-sm font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Giriş yapılıyor...
                    </div>
                  ) : (
                    "Giriş Yap"
                  )}
                </Button>

                <div className="text-center space-y-1 text-sm text-muted-foreground">
                  <p>
                    Hesabınız yok mu?{" "}
                    <Link href="/register" className="text-primary hover:underline">
                      Kayıt olun
                    </Link>
                  </p>
                  <p>
                    Şifrenizi mi unuttunuz?{" "}
                    <Link href="/reset-password" className="text-primary hover:underline">
                      Şifre sıfırla
                    </Link>
                  </p>
                </div>

              </form>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Ana sayfaya dön
          </Link>
        </div>
      </div>
    </AuthBackground>
  )
}
