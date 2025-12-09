"use client"

import { memo } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface Props {
  user: {
    name?: string
    email?: string
  } | null
}

function getDisplayName(user: Props["user"]) {
  return (user?.name || user?.email || "Kullanıcı").trim()
}

function getInitials(name: string) {
  const p = name.split(" ").filter(Boolean)
  return p.length === 1
    ? (p[0][0] || "U").toUpperCase()
    : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

function WelcomeHeaderComponent({ user }: Props) {
  const displayName = getDisplayName(user)
  const initials = getInitials(displayName)

  return (
    <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-lg p-6 relative overflow-hidden">

      {/* Background pulse circle */}
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/5 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16 animate-pulse" />

      <div className="relative z-10 flex items-center gap-3 min-w-0">

        {/* Avatar */}
        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
          <AvatarImage src="/parent-avatar.png" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        {/* Text wrapper */}
        <div className="flex flex-col min-w-0">

          {/* Title - Auto scales to fit long names */}
          <h1
            className="
              font-bold 
              leading-tight 
              whitespace-nowrap 
              overflow-hidden 
              text-[clamp(1.15rem,4.2vw,1.65rem)]
            "
          >
            Hoş geldiniz, {displayName}
          </h1>

          <p className="text-muted-foreground text-sm">
            Çocuğunuzun akademik durumunu kolayca takip edin.
          </p>
        </div>

      </div>
    </div>
  )
}

export const WelcomeHeader = memo(WelcomeHeaderComponent)
