"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"

export function HeroSection() {
  return (
    <section className="relative py-12 md:py-20 bg-gradient-to-br from-card to-background overflow-hidden">
      {/* Background Logo */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <Image
          src="/logo-alfabe.png"
          alt=""
          width={600}
          height={600}
          className="opacity-10 animate-pulse select-none pointer-events-none 
w-[90%] sm:w-[60%] md:w-[40%] lg:w-[30%]"

          priority
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-2xl mx-auto">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 pointer-events-none select-none text-sm sm:text-base">
            Modern Eğitim Yönetim Sistemi
          </Badge>

          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
            Eğitimde Yeni Nesil
            <span className="text-primary"> Dijital Çözüm</span>
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground mb-6 md:mb-8"></p>
        </div>
      </div>

      {/* Decorative dots */}
      <div className="absolute top-16 left-10 w-3 h-3 bg-primary/10 rounded-full animate-pulse" />
      <div
        className="absolute top-40 right-20 w-5 h-5 bg-secondary/10 rounded-full animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-20 left-20 w-3 h-3 bg-accent/10 rounded-full animate-pulse"
        style={{ animationDelay: "2s" }}
      />
    </section>
  )
}
