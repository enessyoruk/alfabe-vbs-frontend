"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
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
  Calendar,
  BookOpen,
  FileText,
  User,
  LogOut,
  Menu,
  Bell,
  BellRing,
  MessageSquare,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

type VbsUser = {
  id: string
  email?: string
  name?: string
  roles?: string[]
  type?: "parent" | "teacher" | "admin" | string
  branch?: string
}

type NotificationType =
  | "homework"
  | "exam"
  | "grade"
  | "announcement"
  | "holiday"
  | "event"
  | "warning"

type Notification = {
  id: string
  title: string
  message: string
  type: NotificationType
  date: string
  isRead?: boolean
}

const NOTIF_STORAGE_KEY = "vbs:parent_notifications_read"

const navigation = [
  { name: "Ana Sayfa", href: "/parent/dashboard", icon: Home },
  { name: "Devamsızlık", href: "/parent/attendance", icon: Calendar },
  { name: "Ödevler", href: "/parent/homework", icon: BookOpen },
  { name: "Sınav Sonuçları", href: "/parent/exam-results", icon: FileText },
  { name: "Rehberlik Notları", href: "/parent/guidance-notes", icon: MessageSquare },
  { name: "Öğrenci Bilgileri", href: "/parent/student-info", icon: User },
]

function readVbsUser(): VbsUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("vbs:user")
    if (!raw) return null
    const obj = JSON.parse(raw)
    const core = obj?.user ? obj.user : obj
    const roles: string[] = Array.isArray(core?.roles) ? core.roles : []
    const type: string | undefined =
      (roles[0] ? roles[0].toLowerCase() : undefined) ||
      (typeof core?.type === "string" ? core.type.toLowerCase() : undefined)
    return {
      id: String(core?.id ?? core?.userId ?? ""),
      email: core?.email,
      name: core?.name ?? core?.fullName,
      roles,
      type,
      branch: core?.branch,
    }
  } catch {
    return null
  }
}

function saveVbsUser(u: VbsUser) {
  try {
    localStorage.setItem("vbs:user", JSON.stringify({ user: u }))
  } catch {}
}

function loadReadNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(NOTIF_STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.map((x: any) => String(x)))
  } catch {
    return new Set()
  }
}

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<VbsUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)

  const router = useRouter()
  const pathname = usePathname()

  // USER
  useEffect(() => {
    let cancelled = false
    const init = () => {
      const u = readVbsUser()
      if (!cancelled) {
        if (u) saveVbsUser(u)
        setUser(u)
        setIsLoading(false)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [])

  // NOTIFICATIONS
  useEffect(() => {
    if (!user?.roles?.includes("Parent")) return
    let cancelled = false

    const fetchNotifications = async () => {
      try {
        setNotifLoading(true)
        const res = await fetch("/api/parent/notifications", {
          credentials: "include",
        })
        const json = await res.json().catch(() => ({} as any))
        if (!res.ok) return

        const arr: Notification[] = Array.isArray(json?.items)
          ? json.items
          : Array.isArray(json)
          ? json
          : []

        const readIds = loadReadNotificationIds()
        const merged = arr.map((n) => ({
          ...n,
          id: String(n.id),
          isRead: readIds.has(String(n.id)),
        }))

        if (!cancelled) {
          const sorted = [...merged].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
          setNotifications(sorted)
        }
      } catch {
      } finally {
        if (!cancelled) setNotifLoading(false)
      }
    }

    fetchNotifications()
    return () => {
      cancelled = true
    }
  }, [user])

  const handleLogout = () => {
    try {
      localStorage.removeItem("vbs:user")
    } catch {}
    router.replace("/login")
    if (typeof window !== "undefined") {
      window.location.assign("/login")
      setTimeout(() => window.location.assign("/login"), 150)
    }
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
    if (!e) return "Veli"
    return e.includes("@") ? e.split("@")[0] : e
  }, [user])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  )
  const latestThree = useMemo(
    () => notifications.slice(0, 3),
    [notifications],
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Sidebar'ı yumuşak aç/kapa
  const toggleSidebar = () => setSidebarOpen((prev) => !prev)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
  <button
    onClick={toggleSidebar}
    className="fixed top-4 left-4 z-[9999] p-2 rounded-md bg-card/80 backdrop-blur-sm lg:hidden"
  >
    <Menu className="h-6 w-6 text-foreground" />
  </button>
)}

      {/* █████ MOBILE SIDEBAR OVERLAY + DRAWER █████ */}
      <div
        className={`
          fixed inset-0 z-[997] lg:hidden
          transition-opacity duration-300
          ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/50 z-[998]"
          onClick={closeSidebar}
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
          <div className="relative z-10 flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm">
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">Veli Paneli</span>
              <span className="text-xs text-muted-foreground">Alfa-β Akademi</span>
            </div>
          </div>

          {/* Menü */}
          <nav className="relative z-10 flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Alt kısım: avatar + çıkış */}
          <div className="relative z-10 border-t bg-card/80 backdrop-blur-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/parent-avatar.png" />
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

      {/* █████ DESKTOP SIDEBAR (AYNEN KALDI) █████ */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <Card className="flex grow flex-col gap-y-5 border-r bg-card/50 backdrop-blur-sm relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-65 bg-no-repeat bg-center bg-contain pointer-events-none select-none"
            style={{
              backgroundImage:
                "url('/images/design-mode/logo-alfabe-removebg-preview.png')",
              backgroundSize: "500px 300px",
            }}
          />
          <div className="relative z-10 flex flex-col gap-2 p-6 border-b">
            <div>
              <h1 className="font-semibold text-foreground">Veli Paneli</h1>
              <p className="text-sm text-muted-foreground">Alfa-β Akademi</p>
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
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>
          <div className="relative z-10 p-6 border-t">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/parent-avatar.png" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {displayName || "Veli"}
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

      {/* █████ MAIN CONTENT █████ */}
      <div className="lg:pl-64">
        {/* TOP BAR */}
        <div className="sticky top-0 z-[999] flex h-16 shrink-0 items-center gap-x-4 border-b bg-card/80 backdrop-blur-sm px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          {/* Hamburger */}
          <Button
            variant="ghost"
            size="sm"
            className={`lg:hidden transition-transform duration-300 ${sidebarOpen ? "translate-x-48" : ""}`}
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1
                className="
                  font-semibold 
                  text-[clamp(1rem,3.8vw,1.25rem)] 
                  leading-tight
                  whitespace-nowrap 
                  overflow-hidden 
                  min-w-0 
                  text-foreground 
                  flex-shrink
                "
              >
                {displayName
                  ? `Hoş geldiniz, ${displayName}`
                  : navigation.find((item) => item.href === pathname)?.name ||
                    "Veli Paneli"}
              </h1>
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Bildirimler */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    {unreadCount > 0 ? (
                      <BellRing className="h-5 w-5" />
                    ) : (
                      <Bell className="h-5 w-5" />
                    )}
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Bildirimler</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {notifLoading ? (
                    <DropdownMenuItem disabled className="py-3">
                      <p className="text-xs text-muted-foreground">
                        Bildirimler yükleniyor...
                      </p>
                    </DropdownMenuItem>
                  ) : latestThree.length === 0 ? (
                    <DropdownMenuItem disabled className="py-3">
                      <p className="text-xs text-muted-foreground">
                        Henüz bildirim bulunmuyor.
                      </p>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      {latestThree.map((n) => (
                        <DropdownMenuItem
                          key={n.id}
                          asChild
                          className="h-auto py-2"
                        >
                          <Link href="/parent/notifications">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                <span
                                  className={`inline-block h-2 w-2 rounded-full ${
                                    n.isRead
                                      ? "bg-muted-foreground/40"
                                      : "bg-primary"
                                  }`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium truncate ${
                                    n.isRead
                                      ? "text-muted-foreground"
                                      : "text-foreground"
                                  }`}
                                >
                                  {n.title}
                                </p>
                                <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  {new Date(n.date).toLocaleDateString("tr-TR")}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      ))}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="justify-center">
                        <Link href="/parent/notifications">
                          <span className="text-xs text-primary">
                            Tüm bildirim detaylarını görüntüle
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* PC dikey çizgi */}
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" />

              {/* Avatar */}
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/parent-avatar.png" />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </div>
            </div>
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
