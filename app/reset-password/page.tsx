"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { AuthBackground } from "@/components/auth/auth-background"
import { toast } from "sonner"


export default function ResetPasswordPage() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const normalizePhone = (value: string) => {
    // Sadece rakam, maksimum 11 hane
    return value.replace(/\D/g, "").slice(0, 11)
  }

  const validatePhoneNumber = (phone: string) => {
    // 05XXXXXXXXX formatında, 11 hane
    return /^05\d{9}$/.test(phone)
  }

  const formatPhoneForDisplay = (phone: string) => {
    if (phone.length !== 11) return phone
    return `${phone.slice(0, 3)}${phone.slice(3, 6).replace(/\d/g, "X")} ${phone
      .slice(6, 9)
      .replace(/\d/g, "X")} ${phone.slice(9).replace(/\d/g, "X")}`
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const cleanPhone = normalizePhone(phoneNumber)
    setPhoneNumber(cleanPhone)

    try {
      if (!validatePhoneNumber(cleanPhone)) {
        throw new Error("Geçerli bir telefon numarası girin. Örn: 05XXXXXXXXX (11 haneli).")
      }

      // TODO: Backend entegrasyonu
      await new Promise((resolve) => setTimeout(resolve, 800))

      setIsSuccess(true)
    } catch (err: any) {
  const msg =
    err?.message ||
    "İşlem sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."

  // 🔥 Sağ altta göster
  toast.error(msg, {
    duration: 2500,
    position: "bottom-right",
  })

  setError(msg)
} finally {
  setIsLoading(false)
}

  }

  // ---------- SUCCESS EKRANI ----------
  if (isSuccess) {
    return (
      <AuthBackground>
        <div className="w-full max-w-md px-3">
          <div className="rounded-[32px] bg-white/80 shadow-xl border border-slate-200/70 backdrop-blur-sm px-6 py-10 sm:px-8 sm:py-12 space-y-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold text-foreground">Talebiniz Alındı</h1>
            <p className="text-muted-foreground">
              Şifre sıfırlama talebiniz başarıyla oluşturuldu. Kayıtlı iletişim bilgileriniz
              üzerinden en kısa sürede sizinle iletişime geçilecektir.
            </p>

            {phoneNumber && (
              <p className="text-xs text-muted-foreground">
                Bildirdiğiniz telefon:{" "}
                <span className="font-medium">{formatPhoneForDisplay(phoneNumber)}</span>
              </p>
            )}

            <div className="space-y-2 pt-4">
              <Button
                onClick={() => {
                  setIsSuccess(false)
                  setPhoneNumber("")
                  setError("")
                }}
                variant="outline"
                className="w-full rounded-full"
              >
                Yeni Talep Oluştur
              </Button>
              <Link href="/login">
                <Button className="w-full rounded-full">Giriş Sayfasına Dön</Button>
              </Link>
            </div>
          </div>
        </div>
      </AuthBackground>
    )
  }

  // ---------- FORM EKRANI ----------
  return (
    <AuthBackground>
      <div className="w-full max-w-md px-3">
        <div className="rounded-[32px] bg-white/80 shadow-xl border border-slate-200/70 backdrop-blur-sm px-6 py-8 sm:px-8 sm:py-10 space-y-8">
          {/* Başlık */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Şifre Sıfırlama</h1>
            <p className="text-primary font-bold">Alfa-β Akademi Bilgi Yönetim Sistemi</p>
          </div>

          {/* Form */}
          <div>
            <form onSubmit={handleResetPassword} className="space-y-6" noValidate>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon Numarası</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="05XXXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(normalizePhone(e.target.value))}
                    className="pl-10 rounded-xl"
                    maxLength={11}
                    required
                    aria-describedby="phone-help"
                  />
                </div>
                <p id="phone-help" className="text-xs text-muted-foreground">
                  Telefon numarası 11 haneli olmalı ve 05 ile başlamalıdır. Örn: 05XXXXXXXXX
                </p>
              </div>

              {error && (
                <Alert className="border-destructive/50 text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 rounded-full py-6"
                disabled={isLoading || !phoneNumber.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Talebiniz işleniyor...
                  </div>
                ) : (
                  "Şifre Sıfırlama Talebi Oluştur"
                )}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Giriş sayfasına dön
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthBackground>
  )
}
