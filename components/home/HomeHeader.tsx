"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { X, Menu } from "lucide-react"

export function HomeHeader() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ===================== HEADER ===================== */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 relative overflow-hidden">
        {/* Dekoratif arka plan */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-red-50/30 via-white/20 to-red-50/30 animate-pulse pointer-events-none"
          aria-hidden="true"
        />

        <div className="absolute top-0 left-0 w-full h-full pointer-events-none" aria-hidden="true">
          <div
            className="absolute top-2 left-10 w-3 h-3 bg-gradient-to-r from-red-400 to-pink-400 rounded-full animate-bounce opacity-60"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="absolute top-4 right-20 w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-bounce opacity-50"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full animate-pulse opacity-40"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute bottom-2 right-1/3 w-3.5 h-3.5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-bounce opacity-30"
            style={{ animationDelay: "0.5s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse opacity-50"
            style={{ animationDelay: "1.5s" }}
          />
          <div
            className="absolute top-6 left-1/3 w-2 h-2 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full animate-bounce opacity-45"
            style={{ animationDelay: "2.5s" }}
          />
        </div>

        {/* REAL CONTENT */}
        <div className="container mx-auto px-4 py-4 relative z-10">
          <div className="flex items-center justify-between">

            {/* ---- LOGO ---- */}
            <Link href="/" className="text-xl font-bold tracking-tight" style={{ color: "#0891b2" }}>
              Alfa-β Akademi
            </Link>

            {/* ---- DESKTOP NAV ---- */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#hakkimizda" className="text-foreground hover:text-primary transition-colors">
                Hakkımızda
              </a>
              <a href="#ogretmenler" className="text-foreground hover:text-primary transition-colors">
                Öğretmenlerimiz
              </a>
              <a href="#sss" className="text-foreground hover:text-primary transition-colors">
                S.S.S
              </a>
              <a href="#iletisim" className="text-foreground hover:text-primary transition-colors">
                İletişim
              </a>

              <Link href="/login">
                <Button className="bg-primary hover:bg-primary/90">Giriş Yap</Button>
              </Link>
            </nav>

            {/* ---- MOBILE HAMBURGER ---- */}
            <button
              className="md:hidden text-foreground"
              onClick={() => setOpen(true)}
              aria-label="Menüyü Aç"
            >
              <Menu className="h-7 w-7" />
            </button>
          </div>
        </div>
      </header>

      {/* ===================== DRAWER BACKDROP ===================== */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ===================== DRAWER PANEL ===================== */}
      <div
        className={`fixed top-0 right-0 h-full w-full bg-white z-[60] transform transition-transform duration-300 ease-out 
        ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <span className="text-xl font-semibold" style={{ color: "#0891b2" }}>
            Alfa-β Akademi
          </span>
          <button onClick={() => setOpen(false)} aria-label="Kapat">
            <X className="h-7 w-7 text-foreground" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex flex-col px-6 py-6 space-y-6 text-lg">

          <a href="#hakkimizda" onClick={() => setOpen(false)} className="active:scale-95 transition">
            Hakkımızda
          </a>

          <a href="#ogretmenler" onClick={() => setOpen(false)} className="active:scale-95 transition">
            Öğretmenlerimiz
          </a>

          <a href="#sss" onClick={() => setOpen(false)} className="active:scale-95 transition">
            S.S.S
          </a>

          <a href="#iletisim" onClick={() => setOpen(false)} className="active:scale-95 transition">
            İletişim
          </a>

          <div className="pt-4">
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button className="w-full py-6 text-base bg-primary hover:bg-primary/90 rounded-full">
                Giriş Yap
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
