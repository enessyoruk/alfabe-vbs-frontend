"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home,
  BookOpen,
  Upload,
  BarChart3,
  UserCheck,
  LogOut,
  Menu,
  X,
  Bell,
  Calendar,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

// ========================================
// USER TYPE
// ========================================
type VbsUser = {
  id: string
  email?: string
  name?: string
  roles?: string[]
  branch?: string
}

// ========================================
// SIDEBAR NAV
// ========================================
const navigation = [
  { name: "Ana Sayfa", href: "/teacher/dashboard", icon: Home },
  { name: "Ödev Yönetimi", href: "/teacher/homework", icon: BookOpen },
  { name: "Sınav Yükleme", href: "/teacher/exam-upload", icon: Upload },
  { name: "Sınav Analizi", href: "/teacher/analytics", icon: BarChart3 },
  { name: "Rehber Öğretmen", href: "/teacher/guidance", icon: UserCheck },
  { name: "Tatil Bildirimleri", href: "/teacher/holidays", icon: Calendar },
]

// ========================================
// READ USER FROM LOCALSTORAGE
// ========================================
function readVbsUser() {
  try {
    const raw = localStorage.getItem("vbs:user")
    if (!raw) return null
    const obj = JSON.parse(raw)
    const core = obj?.user ? obj.user : obj
    return {
      id: String(core?.id ?? core?.userId ?? ""),
      email: core?.email,
      name: core?.name ?? core?.fullName,
      roles: Array.isArray(core?.roles) ? core.roles : [],
      branch: core?.branch,
    }
  } catch {
    return null
  }
}

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<VbsUser | null>(null)
  const [loading, setLoading] = useState(true)

  // ========================================
  // AUTH
  // ========================================
  useEffect(() => {
    const u = readVbsUser()
    const nextUrl = `/login?next=${encodeURIComponent(pathname || "/teacher/dashboard")}`

    if (!u) {
      router.replace(nextUrl)
      return
    }
    if (!u.roles?.includes("Teacher")) {
      router.replace(nextUrl)
      return
    }

    setUser(u)
    setLoading(false)
  }, [router, pathname])

  const initials = useMemo(() => {
    const n = (user?.name || user?.email || "").trim()
    if (!n) return "U"
    const parts = n.split(" ").filter(Boolean)
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }, [user])

  const displayName = user?.name?.trim()
    ? user.name.trim()
    : user?.email?.split("@")[0] || "Öğretmen"

  const handleLogout = () => {
    try {
      localStorage.removeItem("vbs:user")
    } catch {}
    router.replace("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-b-2 border-primary animate-spin" />
      </div>
    )
  }

  if (!user) return null

  // ========================================
  // LAYOUT STARTS
  // ========================================
  return (
    <div className="min-h-screen bg-background">

      {/* ████ MOBILE SIDEBAR OVERLAY + DRAWER ████ */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 w-64 bg-card border-r shadow-lg flex flex-col">
            {/* Top */}
            <div className="flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/design-mode/logo-alfabe-removebg-preview.png"
                  alt="Logo"
                  width={50}
                  height={50}
                  className="rounded"
                />
                <span className="font-semibold text-foreground">
                  Öğretmen Paneli
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Menu */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Bottom user info */}
            <div className="p-4 border-t bg-card/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/teacher-avatar.png" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium truncate">{displayName}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Çıkış Yap
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ████ DESKTOP SIDEBAR ████ */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">

        <Card className="flex grow flex-col border-r bg-card/50 backdrop-blur-sm relative overflow-hidden">

          {/* BACKGROUND LOGO (600 × 360 px) */}
          <div
            className="absolute inset-0 opacity-60 bg-no-repeat bg-center bg-contain pointer-events-none select-none"
            style={{
              backgroundImage: "url('/images/design-mode/logo-alfabe-removebg-preview.png')",
              backgroundSize: "600px 360px",
            }}
          />

          {/* Panel title */}
          <div className="relative z-10 p-6 border-b">
            <h1 className="font-semibold text-foreground">Öğretmen Paneli</h1>
            <p className="text-sm text-muted-foreground">Alfa-β Akademi</p>
          </div>

          {/* MENU */}
          <nav className="relative z-10 flex-1 flex flex-col px-6 py-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* BOTTOM USER BLOCK (VELİ PANELİ İLE AYNI) */}
          <div className="relative z-10 p-6 border-t">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/teacher-avatar.png" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.branch || "Öğretmen"}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>

        </Card>
      </div>

      {/* ████ MAIN CONTENT (VELİ PANELİYLE AYNI) ████ */}
      <div className="lg:pl-64">

        {/* TOP BAR */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b bg-card/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
          {/* Mobile hamburger */}
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page name / Welcome */}
          <div className="flex flex-1 items-center">
            <h1 className="font-semibold text-[clamp(1rem,3.2vw,1.25rem)] text-foreground truncate">
              {displayName
                ? `Hoş geldiniz, ${displayName} hocam`
                : "Öğretmen Paneli"}
            </h1>
          </div>

          {/* Header icons */}
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>

            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" />

            <Avatar className="h-8 w-8">
              <AvatarImage src="/teacher-avatar.png" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* CONTENT */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>

      </div>
    </div>
  )
}
