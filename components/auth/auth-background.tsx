// components/auth/auth-background.tsx
"use client"

import type { ReactNode } from "react"

interface AuthBackgroundProps {
  children: ReactNode
}

export function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hafif ana gradient arka plan */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.18),transparent_55%)]" />

      {/* 🔹 CANLI, GEZEN BLUR BLOBLAR */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Blob 1 - sol üst, cyan */}
        <div
          className="blob-anim-1 absolute top-[6%] left-[8%] h-64 w-64 rounded-full blur-3xl opacity-80"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(34,211,238,0.78), rgba(255,255,255,0))",
          }}
        />

        {/* Blob 2 - sağ üst, AÇIK mavi / cam tonu */}
        <div
          className="blob-anim-2 absolute top-[10%] right-[12%] h-72 w-72 rounded-full blur-3xl opacity-80"
          style={{
            background:
              "radial-gradient(circle at 40% 30%, rgba(56,189,248,0.60), rgba(255,255,255,0))",
          }}
        />

        {/* Blob 3 - sol orta, turkuaz/yeşil */}
        <div
          className="blob-anim-3 absolute top-[46%] left-[6%] h-72 w-72 rounded-full blur-3xl opacity-80"
          style={{
            background:
              "radial-gradient(circle at 30% 40%, rgba(45,212,191,0.78), rgba(255,255,255,0))",
          }}
        />

        {/* Blob 4 - sağ orta, mavi (mor tonuna yakın, biraz soluk) */}
        <div
          className="blob-anim-4 absolute top-[52%] right-[8%] h-72 w-72 rounded-full blur-3xl opacity-75"
          style={{
            background:
              "radial-gradient(circle at 40% 40%, rgba(59,130,246,0.58), rgba(255,255,255,0))",
          }}
        />

        {/* Blob 5 - alt orta, yeşil */}
        <div
          className="blob-anim-5 absolute bottom-[-7rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl opacity-80"
          style={{
            background:
              "radial-gradient(circle at 50% 35%, rgba(34,197,94,0.78), rgba(255,255,255,0))",
          }}
        />
      </div>

      {/* İçerik alanı */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6">
        {children}
      </div>
    </div>
  )
}
