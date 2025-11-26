import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"   // ✅ Inter kullan
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Alfa-β Akademi - Veli ve Öğretmen Bilgi Sistemi",
  description: "Alfa-β Akademi özel öğretim kurumu veli ve öğretmen bilgi yönetim sistemi",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${inter.className} antialiased`}>
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  )
}
