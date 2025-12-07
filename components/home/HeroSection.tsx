"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"

export function HeroSection() {
  return (
    <section className="relative py-20 bg-gradient-to-br from-card to-background overflow-hidden">

      {/* Arka plandaki dev logo */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <div className="relative">
          <Image
            src="/logo-alfabe.png"
            alt=""
            width={800}
            height={800}
            className="opacity-10 animate-pulse select-none pointer-events-none"
            priority
          />
        </div>
      </div>

      {/* Metin alanı */}
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-3xl mx-auto">

          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 pointer-events-none select-none">
            Modern Eğitim Yönetim Sistemi
          </Badge>

          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance animate-fade-in">
            Eğitimde Yeni Nesil 
            <span className="text-primary"> Dijital Çözüm</span>
          </h2>

          <p className="text-xl text-muted-foreground mb-8 text-pretty animate-fade-in-delay"></p>

        </div>
      </div>

      {/* Dekoratif noktalar */}
      <div
        className="absolute top-20 left-10 w-4 h-4 bg-primary/10 rounded-full animate-pulse"
        aria-hidden="true"
      />
      <div
        className="absolute top-40 right-20 w-6 h-6 bg-secondary/10 rounded-full animate-pulse"
        style={{ animationDelay: "1s" }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-20 left-20 w-3 h-3 bg-accent/10 rounded-full animate-pulse"
        style={{ animationDelay: "2s" }}
        aria-hidden="true"
      />

    </section>
  )
}
