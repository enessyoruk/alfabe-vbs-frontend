"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Eye,
  EyeOff,
  Phone,
  Lock,
  User,
  GraduationCap,
  Mail,
  UserPlus,
  CheckCircle,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthBackground } from "@/components/auth/auth-background"
import { toast } from "sonner"


type UserType = "parent" | "teacher"

type FormDataState = {
  name: string
  phoneNumber: string
  email: string
  password: string
  confirmPassword: string
}

type FieldErrors = {
  name?: string
  phoneNumber?: string
  email?: string
  password?: string
  confirmPassword?: string
  agreements?: string
}

function passwordIsStrongEnough(pwd: string) {
  // En az 6 karakter, en az 1 harf (TR dahil) ve en az 1 rakam
  return /^(?=.*[A-Za-zÇĞİÖŞÜçğıöşü])(?=.*\d).{6,}$/.test(pwd)
}

function getErrors(
  data: FormDataState,
  userType: UserType,
  agreementsAccepted: boolean,
): FieldErrors {
  const errors: FieldErrors = {}
  const name = data.name.trim()

  if (name.length < 3) {
    errors.name = "Ad Soyad en az 3 karakter olmalıdır."
  } else if (!/^[A-Za-zÇĞİÖŞÜçğıöşü\s]{3,150}$/.test(name)) {
    errors.name = "Ad Soyad yalnızca harf ve boşluk içerebilir."
  }

  if (!/^\d{11}$/.test(data.phoneNumber)) {
    errors.phoneNumber =
      "Telefon numarası 11 haneli olmalı ve sadece rakamlardan oluşmalıdır (05XXXXXXXXX)."
  }

  const emailTrimmed = data.email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    errors.email = "Geçerli bir e-posta adresi girin."
  }

  if (!passwordIsStrongEnough(data.password)) {
    errors.password =
      "Şifre en az 6 karakter olmalı, en az bir harf (A-Z / a-z / Türkçe karakter) ve en az bir rakam içermelidir."
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = "Şifreler eşleşmiyor."
  }

  if (!["parent", "teacher"].includes(userType)) {
    if (!errors.name) {
      errors.name = "Geçersiz kullanıcı tipi."
    }
  }

  if (!agreementsAccepted) {
    errors.agreements =
      "Kayıt olabilmek için KVKK Aydınlatma Metni ile Gizlilik ve Çerez Politikasını okuduğunuzu onaylamalısınız."
  }

  return errors
}

export default function RegisterPage() {
  const [userType, setUserType] = useState<UserType>("parent")
  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [agreementsAccepted, setAgreementsAccepted] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [hasInteracted, setHasInteracted] = useState(false)

  const router = useRouter()

  const isFormValid = useMemo(() => {
    const errs = getErrors(formData, userType, agreementsAccepted)
    return Object.keys(errs).length === 0
  }, [formData, userType, agreementsAccepted])

  const recomputeErrors = (
    nextData: FormDataState,
    nextUserType: UserType,
    nextAgreements: boolean,
  ) => {
    const errs = getErrors(nextData, nextUserType, nextAgreements)
    setFieldErrors(errs)
    return errs
  }

  const handleInputChange = (field: keyof FormDataState, value: string) => {
    setHasInteracted(true)

    if (field === "phoneNumber") {
      const digits = value.replace(/\D/g, "").slice(0, 11)
      const nextData = { ...formData, phoneNumber: digits }
      setFormData(nextData)
      recomputeErrors(nextData, userType, agreementsAccepted)
      if (error) setError("")
      return
    }

    if (field === "name") {
      const cleaned = value.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü\s]/g, "").slice(0, 150)
      const nextData = { ...formData, name: cleaned }
      setFormData(nextData)
      recomputeErrors(nextData, userType, agreementsAccepted)
      if (error) setError("")
      return
    }

    const nextData = { ...formData, [field]: value }
    setFormData(nextData)
    recomputeErrors(nextData, userType, agreementsAccepted)
    if (error) setError("")
  }

  const handleUserTypeChange = (value: string) => {
    const nextType = value as UserType
    setHasInteracted(true)
    setUserType(nextType)
    recomputeErrors(formData, nextType, agreementsAccepted)
    if (error) setError("")
  }

  const handleAgreementsChange = (v: boolean | "indeterminate") => {
    const nextAccepted = Boolean(v)
    setHasInteracted(true)
    setAgreementsAccepted(nextAccepted)
    recomputeErrors(formData, userType, nextAccepted)
    if (error) setError("")
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setHasInteracted(true)
    setError("")

    const errs = recomputeErrors(formData, userType, agreementsAccepted)
    if (Object.keys(errs).length > 0) {
      setError("Lütfen formdaki hataları düzeltin.")
      return
    }

    setIsLoading(true)
    try {
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), 12000)

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          phoneNumber: formData.phoneNumber,
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          userType, // "parent" | "teacher"
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(t))

      let data: any = {}
      try {
        data = await response.json()
      } catch {
        // JSON parse hatası durumunda sessiz geç
      }

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(
            data?.error ||
              "Bu telefon veya e-posta ile daha önce başvuru yapılmış. Lütfen farklı bilgilerle deneyin.",
          )
        }
        if (response.status === 400) {
          throw new Error(data?.error || "Eksik veya hatalı bilgi gönderdiniz.")
        }
        if (response.status === 429) {
          const retryAfter = data?.retryAfter ? ` ${data.retryAfter} sn sonra tekrar deneyin.` : ""
          throw new Error(data?.error || `Çok fazla istek.${retryAfter}`)
        }
        throw new Error(data?.error || `Kayıt işlemi başarısız (HTTP ${response.status})`)
      }

      setSuccess(true)
    } catch (err: any) {
  const msg =
    err?.name === "AbortError"
      ? "İstek zaman aşımına uğradı. Lütfen tekrar deneyin."
      : err?.message || "Kayıt işlemi sırasında bir hata oluştu."

  toast.error(msg, {
    duration: 3000,
    position: "bottom-right",
  })

  setError(msg)
} finally {
  setIsLoading(false)
}

  }

  // ---------- SUCCESS EKRANI (aynı büyük panel stilinde) ----------
  if (success) {
    return (
      <AuthBackground>
        <div className="w-full max-w-md px-3">
          <div className="rounded-[32px] bg-white/80 shadow-xl border border-slate-200/70 backdrop-blur-sm px-6 py-10 sm:px-8 sm:py-12 space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-green-600">Kayıt Başarılı!</h1>
            <p className="text-base font-medium text-foreground">
              Admin onayından sonra sisteme giriş yapabileceksiniz.
            </p>
            <Button onClick={() => router.push("/login")} className="w-full rounded-full py-6 mt-4">
              Giriş Sayfasına Dön
            </Button>
          </div>
        </div>
      </AuthBackground>
    )
  }

  // ---------- FORM EKRANI ----------
  return (
    <AuthBackground>
      <div className="w-full max-w-md px-3">
        {/* Büyük yuvarlak panel */}
        <div className="rounded-[32px] bg-white/80 shadow-xl border border-slate-200/70 backdrop-blur-sm px-6 py-8 sm:px-8 sm:py-10 space-y-8">
          {/* Başlık */}
          <div className="text-center space-y-1">
            <h1 className="text-primary font-bold">Alfa-β Akademi Kayıt Sistemi</h1>
          </div>

          {/* Logo + Form blok */}
          <div className="relative">
            {/* Arka plan logo */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-70 pointer-events-none"
              aria-hidden="true"
            >
              <Image
                src="/images/design-mode/logo-alfabe-removebg-preview.png"
                alt=""
                width={500}
                height={1000}
                className="object-contain"
                priority
              />
            </div>

            {/* Form içeriği */}
            <div className="relative z-10 space-y-6">
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Kayıt Ol
                </h2>
                <p className="text-sm text-muted-foreground">
                  Alfa-β Akademi'ye kayıt olmak için bilgilerinizi girin
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4" noValidate>
                {/* Kullanıcı tipi */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Kullanıcı Tipi</Label>
                  <RadioGroup
                    value={userType}
                    onValueChange={handleUserTypeChange}
                    className="grid grid-cols-2 gap-4"
                  >
                    <label
                      htmlFor="parent"
                      className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-input hover:bg-accent/50 transition-colors bg-white/70"
                    >
                      <RadioGroupItem value="parent" id="parent" />
                      <User className="h-4 w-4 text-primary" />
                      <span>Veli</span>
                    </label>
                    <label
                      htmlFor="teacher"
                      className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-input hover:bg-accent/50 transition-colors bg-white/70"
                    >
                      <RadioGroupItem value="teacher" id="teacher" />
                      <GraduationCap className="h-4 w-4 text-secondary" />
                      <span>Öğretmen</span>
                    </label>
                  </RadioGroup>
                </div>

                {/* Ad Soyad */}
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      inputMode="text"
                      placeholder="Adınız ve soyadınız"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="pl-10 rounded-xl"
                      required
                    />
                  </div>
                  {hasInteracted && fieldErrors.name && (
                    <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>
                  )}
                </div>

                {/* Telefon */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon Numarası</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="\\d{11}"
                      maxLength={11}
                      placeholder="05XXXXXXXXX"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      className="pl-10 rounded-xl"
                      required
                      aria-describedby="phone-help"
                    />
                  </div>
                  {hasInteracted && fieldErrors.phoneNumber && (
                    <p className="mt-1 text-xs text-destructive">{fieldErrors.phoneNumber}</p>
                  )}
                </div>

                {/* E-posta */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta Adresi</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10 rounded-xl"
                      required
                    />
                  </div>
                  {hasInteracted && fieldErrors.email && (
                    <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Şifre */}
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="En az 6 karakter, harf ve rakam içermeli"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-10 pr-10 rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    
                  </p>
                  {hasInteracted && fieldErrors.password && (
                    <p className="mt-1 text-xs text-destructive">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Şifre tekrar */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Şifrenizi tekrar girin"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="pl-10 pr-10 rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {hasInteracted && fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                  )}
                </div>

                {/* KVKK onayı */}
                <div className="space-y-2 border rounded-xl p-3 bg-muted/40">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="agreements"
                      checked={agreementsAccepted}
                      onCheckedChange={handleAgreementsChange}
                    />
                    <Label
                      htmlFor="agreements"
                      className="text-xs sm:text-sm font-normal leading-snug cursor-pointer"
                    >
                      <span className="font-semibold">Kayıt ol</span> butonuna basmadan önce{" "}
                      <Link href="/kvkk" className="text-primary underline underline-offset-2">
                        KVKK Aydınlatma Metni
                      </Link>{" "}
                      ile{" "}
                      <Link href="/gizlilik" className="text-primary underline underline-offset-2">
                        Gizlilik ve Çerez Politikasını
                      </Link>{" "}
                      okuduğumu, anladığımı ve kabul ettiğimi beyan ediyorum.
                    </Label>
                  </div>
                  {hasInteracted && fieldErrors.agreements && (
                    <p className="mt-1 text-xs text-destructive">{fieldErrors.agreements}</p>
                  )}
                </div>

                {/* Genel hata */}
                {error && (
                  <Alert className="border-destructive/50 text-destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Gönder butonu */}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 rounded-full py-6"
                  disabled={isLoading || !isFormValid}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Kayıt yapılıyor...
                    </div>
                  ) : (
                    "Kayıt Ol"
                  )}
                </Button>

                {/* Giriş linki */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Zaten hesabınız var mı?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                      Giriş yapın
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Panelin altındaki geri linki */}
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
