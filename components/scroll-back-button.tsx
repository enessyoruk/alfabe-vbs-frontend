// components/scroll-back-button.tsx
"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useCallback } from "react"

export function ScrollBackButton() {
  const router = useRouter()

  const handleClick = useCallback(() => {
    // Eğer geri gidecek bir geçmiş varsa history.back, yoksa ana sayfa
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }, [router])

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border bg-background/90 px-4 py-2 text-sm font-medium shadow-lg backdrop-blur hover:bg-primary hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      aria-label="Önceki sayfaya dön"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Geri Dön</span>
    </button>
  )
}
