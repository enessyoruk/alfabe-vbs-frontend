"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  Bell,
  Calendar,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

type VbsUser = {
  id: string
  email?: string
  name?: string
  roles?: string[]
  branch?: string
}

type HeaderNotification = {
  id: string | number
  title: string
  message: string
  date: string
  isRead: boolean
}

const navigation = [
  { name: "Ana Sayfa", href: "/teacher/dashboard", icon: Home },
  { name: "Ödev Yönetimi", href: "/teacher/homework", icon: BookOpen },
  { name: "Sınav Yükleme", href: "/teacher/exam-upload", icon: Upload },
  { name: "Sınav Analizi", href: "/teacher/analytics", icon: BarChart3 },
  { name: "Rehber Öğretmen", href: "/teacher/guidance", icon: UserCheck },
  { name: "Tatil Bildirimleri", href: "/teacher/holidays", icon: Calendar },
]

// --------------------------------------------------

function saveTeacherNotificationReadSet(userId: string | null, set: Set<string>) {
  if (typeof window === "undefined") return
  try {
    const key = `vbs:teacher:notifications:read:${userId || "anon"}`
    window.localStorage.setItem(key, JSON.stringify(Array.from(set)))
  } catch {}
}

function readVbsUser() {
  try {
    const raw = localStorage.getItem("vbs:user")
    if (!raw) return null
    const obj = JSON.parse(raw)
    const core = obj?.user ? obj.user : obj
    const roles: string[] = Array.isArray(core?.roles) ? core.roles : []

    return {
      id: String(core?.id ?? core?.userId ?? ""),
      email: core?.email,
      name: core?.name ?? core?.fullName,
      roles,
      branch: core?.branch,
    }
  } catch {
    return null
  }
}

function readTeacherUserId(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem("vbs:user")
    if (!raw) return null
    const obj = JSON.parse(raw)
    const core = obj?.user ?? obj
    const id = core?.id ?? core?.userId
    return id ? String(id) : null
  } catch {
    return null
  }
}

function getTeacherNotificationReadSet(userId: string | null): Set<string> {
  if (typeof window === "undefined") return new Set<string>()
  try {
    const key = `vbs:teacher:notifications:read:${userId || "anon"}`
    const raw = window.localStorage.getItem(key)
    if (!raw) return new Set<string>()
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return new Set<string>()
    return new Set(arr.map((x: any) => String(x)))
  } catch {
    return new Set<string>()
  }
}

// --------------------------------------------------

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<VbsUser | null>(null)
  const [loading, setLoading] = useState(true)

  const [headerNotifications, setHeaderNotifications] = useState<HeaderNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)

  const router = useRouter()
  const pathname = usePathname()

  // AUTH GUARD
  useEffect(() => {
    const u = readVbsUser()
    const nextUrl = `/login?next=${encodeURIComponent(pathname || "/teacher/dashboard")}`

    if (!u) {
      router.replace(nextUrl)
      return
    }

    const ok = u.roles?.includes("Teacher")
    if (!ok) {
      router.replace(nextUrl)
      return
    }

    setUser(u)
    setLoading(false)
  }, [router, pathname])

  // NOTIFICATIONS
  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function loadHeaderNotifications() {
      try {
        setNotificationsLoading(true)

        const res = await fetch("/api/vbs/teacher/notifications", {
          method: "GET",
          credentials: "include",
        })

        if (!res.ok) {
          if (!cancelled) setHeaderNotifications([])
          return
        }

        const data = await res.json()
        const userId = readTeacherUserId()
        const readSet = getTeacherNotificationReadSet(userId)

        if (!cancelled) {
          if (data && Array.isArray(data.items)) {
            const mapped = data.items.map((n: any) => ({
              id: n.id,
              title: String(n.title ?? ""),
              message: String(n.message ?? ""),
              date: String(n.date ?? n.createdAt ?? new Date().toISOString()),
              isRead: readSet.has(String(n.id)),
            }))

            setHeaderNotifications(mapped)
          } else {
            setHeaderNotifications([])
          }
        }
      } catch {
        if (!cancelled) setHeaderNotifications([])
      } finally {
        if (!cancelled) setNotificationsLoading(false)
      }
    }

    loadHeaderNotifications()
    return () => {
      cancelled = true
    }
  }, [user, pathname])

  const unreadCount = useMemo(
    () => headerNotifications.filter((n) => !n.isRead).length,
    [headerNotifications],
  )

  function markHeaderNotificationAsRead(id: string | number) {
    const userId = readTeacherUserId()

    setHeaderNotifications((prev) => {
      const next = prev.map((n) =>
        String(n.id) === String(id) ? { ...n, isRead: true } : n
      )

      if (userId) {
        const set = getTeacherNotificationReadSet(userId)
        set.add(String(id))
        saveTeacherNotificationReadSet(userId, set)
      }

      return next
    })
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem("vbs:user")
    } catch {}
    router.replace("/login")
  }

  const initials = useMemo(() => {
    const n = (user?.name || user?.email || "").trim()
    if (!n) return "U"
    const parts = n.split(" ").filter(Boolean)
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }, [user])

  const displayName = useMemo(() => {
    if (user?.name && user.name.trim()) return user.name.trim()
    const e = user?.email || ""
    return e.includes("@") ? e.split("@")[0] : e
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">

      
      {/* MOBILE SIDEBAR */}
<div
  className={`
    fixed inset-0 z-50 lg:hidden
    transition-opacity duration-300
    ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
  `}
>

  {/* Overlay */}
  <div
    className="absolute inset-0 bg-black/50"
    onClick={() => setSidebarOpen(false)}
  />

  {/* Drawer */}
  <div
    className={`
      absolute inset-y-0 left-0 w-64 bg-card border-r shadow-lg
      flex flex-col
      transform transition-transform duration-300 ease-out
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    `}
  >

    {/* Sağ üst üç çizgi (veli paneli gibi) */}
    <button
      onClick={() => setSidebarOpen(false)}
      className="absolute top-3 right-3 z-[200] p-2 rounded-md hover:bg-muted transition-colors lg:hidden"
    >
      <Menu className="h-5 w-5 text-foreground" />
    </button>

    {/* Arka plan logo */}
    <div
      className="absolute inset-0 opacity-60 bg-no-repeat bg-center bg-contain pointer-events-none"
      style={{
        backgroundImage:
          "url('/images/design-mode/logo-alfabe-removebg-preview.png')",
        backgroundSize: "360px 220px",
      }}
    />

    {/* Üst başlık */}
    <div className="relative z-10 flex flex-col justify-center p-4 border-b bg-card/80 backdrop-blur-sm">
      <span className="font-semibold text-foreground">Öğretmen Paneli</span>
      <span className="text-xs text-muted-foreground">Alfa-β Akademi</span>
    </div>

    {/* Menü */}
    <nav className="relative z-10 flex-1 p-4 space-y-2 overflow-y-auto">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "text-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>

    {/* Footer */}
    <div className="relative z-10 border-t bg-card/80 backdrop-blur-sm p-4">
      <div className="flex items-center gap-3 mb-3 min-w-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src="/teacher-avatar.png" />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground whitespace-nowrap">
            {displayName || "Öğretmen"}
          </p>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {user.branch || "Öğretmen"}
          </p>
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

  </div>
</div>




      {/* ----------------------------- */}
      {/* DESKTOP SIDEBAR (PC) */}
      {/* ----------------------------- */}

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <Card className="flex grow flex-col gap-y-5 border-r bg-card/50 backdrop-blur-sm relative overflow-hidden">

          {/* Background watermark */}
          <div
            className="absolute inset-0 opacity-65 bg-no-repeat bg-center bg-contain pointer-events-none select-none"
            style={{
              backgroundImage:
                "url('/images/design-mode/logo-alfabe-removebg-preview.png')",
              backgroundSize: "360px 220px",
            }}
          />

          <div className="relative z-10 flex items-center gap-3 p-6 border-b">
            <div>
              <h1 className="font-semibold text-foreground whitespace-nowrap">
                Öğretmen Paneli
              </h1>
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                Alfa-β Akademi
              </p>
            </div>
          </div>

          <nav className="relative z-10 flex flex-1 flex-col px-6">
            <div className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex gap-x-3 rounded-lg p-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* ---- PC Teacher Info (truncate kaldırıldı) ---- */}
          <div className="relative z-10 p-6 border-t">
            <div className="flex items-center gap-3 mb-4 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/teacher-avatar.png" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p
                  className="
                    text-sm font-medium text-foreground
                    whitespace-nowrap
                    text-[clamp(0.75rem,0.8vw,0.95rem)]
                  "
                >
                  {displayName}
                </p>

                <p
                  className="
                    text-xs text-muted-foreground
                    whitespace-nowrap
                    text-[clamp(0.65rem,0.7vw,0.85rem)]
                  "
                >
                  {user.branch || "Öğretmen"}
                </p>
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

      {/* ----------------------------- */}
      {/* TOP BAR */}
      {/* ----------------------------- */}

      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-card/80 backdrop-blur-sm px-4 sm:gap-x-6 sm:px-6 lg:px-8">

          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center min-w-0">
              <h1
  className="
    font-semibold 
    text-[clamp(1rem,3.6vw,1.25rem)] 
    whitespace-nowrap 
    overflow-hidden 
    leading-tight
    text-foreground
    flex-shrink 
    min-w-0
  "
>


  {displayName
    ? `Hoş geldiniz, ${displayName} hocam`
    : (navigation.find((i) => i.href === pathname)?.name || "Öğretmen Paneli")}
</h1>

            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6 flex-shrink-0">

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative flex-shrink-0">

                    <Bell className="h-5 w-5" />
                    {!notificationsLoading && unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-secondary text-secondary-foreground text-xs flex items-center justify-center">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Bildirimler</span>
                    <Link href="/teacher/notifications">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Tümünü Gör
                      </Button>
                    </Link>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {notificationsLoading && (
                    <DropdownMenuItem disabled>
                      <p className="text-sm text-muted-foreground">Bildirimler yükleniyor...</p>
                    </DropdownMenuItem>
                  )}

                  {!notificationsLoading && headerNotifications.length === 0 && (
                    <DropdownMenuItem disabled>
                      <p className="text-sm text-muted-foreground">Yeni bildirim yok</p>
                    </DropdownMenuItem>
                  )}

                  {!notificationsLoading &&
                    headerNotifications.slice(0, 4).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className="flex flex-col items-start p-3 cursor-pointer"
                        onClick={() => markHeaderNotificationAsRead(n.id)}
                      >
                        <div className="flex items-start justify-between w-full">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium truncate ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                {n.title}
                              </p>
                              {!n.isRead && <div className="w-2 h-2 bg-secondary rounded-full flex-shrink-0" />}
                            </div>

                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(n.date).toLocaleString("tr-TR")}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* ----------------------------- */}
        {/* PAGE CONTENT */}
        {/* ----------------------------- */}

        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
