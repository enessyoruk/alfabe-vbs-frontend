"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bell, Calendar, AlertCircle, Info, CheckCircle2, ArrowLeft } from "lucide-react"

type Role = "Parent" | "Teacher" | string
type VbsUser = { id?: string; email?: string; name?: string; roles?: Role[] }

type ApiItem = {
  id: string | number
  title: string
  message: string
  type?: "announcement" | "holiday" | "exam" | "event" | "warning"
  date: string
}

type UiNotification = {
  id: string
  title: string
  message: string
  type: "announcement" | "holiday" | "exam" | "event" | "warning"
  date: string
  isRead: boolean
  priority: "high" | "medium" | "low"
}

function parseStoredUser(raw: string | null): VbsUser | null {
  if (!raw) return null
  try {
    const stored = JSON.parse(raw)
    return (stored?.user ?? stored) as VbsUser
  } catch {
    return null
  }
}

function pickEndpointByRoles(roles: Role[] | undefined): string {
  if (!roles || roles.length === 0) return "/api/notifications" // geriye uyum
  if (roles.includes("Parent")) return "/api/parent/notifications"
  if (roles.includes("Teacher")) return "/api/teacher/notifications"
  return "/api/notifications"
}

function normalizeItem(x: ApiItem): UiNotification {
  // tip yoksa backend default "announcement"
  const t = (x.type ?? "announcement") as UiNotification["type"]
  // çok basit bir öncelik sezgisi (istersen geliştiririz)
  const priority: UiNotification["priority"] =
    t === "warning" || t === "holiday" ? "high" : t === "exam" ? "medium" : "low"

  return {
    id: String(x.id),
    title: x.title,
    message: x.message,
    type: t,
    date: x.date,
    isRead: false,
    priority,
  }
}

function getNotificationIcon(type: UiNotification["type"]) {
  switch (type) {
    case "holiday":
      return <Calendar className="h-5 w-5 text-green-600" />
    case "announcement":
      return <Bell className="h-5 w-5 text-blue-600" />
    case "exam":
      return <AlertCircle className="h-5 w-5 text-orange-600" />
    case "event":
      return <Info className="h-5 w-5 text-purple-600" />
    case "warning":
      return <AlertCircle className="h-5 w-5 text-red-600" />
    default:
      return <Bell className="h-5 w-5 text-gray-600" />
  }
}

function getNotificationBadge(type: UiNotification["type"]) {
  switch (type) {
    case "holiday":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Tatil
        </Badge>
      )
    case "announcement":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Duyuru
        </Badge>
      )
    case "exam":
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Sınav
        </Badge>
      )
    case "event":
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          Etkinlik
        </Badge>
      )
    case "warning":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          Uyarı
        </Badge>
      )
    default:
      return <Badge variant="secondary">Bilgi</Badge>
  }
}

function getPriorityBorder(priority: UiNotification["priority"]) {
  switch (priority) {
    case "high":
      return "border-l-red-500"
    case "medium":
      return "border-l-orange-500"
    case "low":
      return "border-l-green-500"
    default:
      return "border-l-gray-500"
  }
}

export default function NotificationsPage() {
  const [items, setItems] = useState<UiNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem("vbs:user") : null
        const u = parseStoredUser(raw)
        const endpoint = pickEndpointByRoles(u?.roles)

        // Önce rol-endpoint’ine istek at; 404/405 gelirse geriye uyum için /api/notifications’a düş
        const res = await fetch(endpoint, { credentials: "include" })
        let data: any
        if (!res.ok) {
          const fallback = await fetch("/api/notifications", { credentials: "include" })
          data = await fallback.json().catch(() => ({}))
          if (!fallback.ok) throw new Error(data?.error || `Bildirim alınamadı (HTTP ${fallback.status})`)
        } else {
          data = await res.json().catch(() => ({}))
        }

        // Beklenen format: { items: ApiItem[] }  (backend AdminNotificationsController böyle dönüyor)
        const arr: ApiItem[] = Array.isArray(data?.items) ? data.items : []
        if (!arr.length) {
          // Boş olmasını hata saymıyoruz; sadece liste boş
          if (!cancelled) {
            setItems([])
          }
        } else {
          if (!cancelled) {
            setItems(arr.map(normalizeItem))
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Bildirimler yüklenemedi.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items])

  const markAllAsRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const toggleNotificationRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Ana Sayfa
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground" style={{ color: "#0891b2" }}>
                  Bildirimler
                </h1>
                <p className="text-sm text-muted-foreground">Okul duyuruları ve önemli bilgiler</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {unreadCount} Okunmamış
              </Badge>
              <Button onClick={markAllAsRead} disabled={unreadCount === 0} className="bg-primary hover:bg-primary/90">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Tümünü İşaretle
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="max-w-4xl mx-auto mb-6">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="max-w-4xl mx-auto space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-5 w-40 bg-muted rounded mb-2" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Notifications List */}
            <div className="max-w-4xl mx-auto space-y-4">
              {items.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Henüz bildirim yok</h3>
                    <p className="text-muted-foreground">Yeni bildirimler burada görünecektir.</p>
                  </CardContent>
                </Card>
              ) : (
                items.map((n) => (
                  <Card
                    key={n.id}
                    className={`cursor-pointer transition-all hover:shadow-md border-l-4 ${getPriorityBorder(n.priority)} ${
                      !n.isRead ? "bg-blue-50/50 border-blue-200" : "bg-card"
                    }`}
                    onClick={() => toggleNotificationRead(n.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {getNotificationIcon(n.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CardTitle className={`text-lg ${!n.isRead ? "font-bold" : "font-semibold"}`}>
                                {n.title}
                              </CardTitle>
                              {!n.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                            </div>
                            <div className="flex items-center gap-2">
                              {getNotificationBadge(n.type)}
                              <CardDescription className="text-sm">
                                {new Date(n.date).toLocaleDateString("tr-TR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {n.isRead ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className={`text-muted-foreground ${!n.isRead ? "font-medium" : ""}`}>{n.message}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Summary Stats */}
            <div className="max-w-4xl mx-auto mt-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-primary">{items.length}</div>
                    <p className="text-sm text-muted-foreground">Toplam Bildirim</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
                    <p className="text-sm text-muted-foreground">Okunmamış</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {items.filter((n) => n.type === "holiday").length}
                    </div>
                    <p className="text-sm text-muted-foreground">Tatil Duyurusu</p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-600">
                      {items.filter((n) => n.type === "exam").length}
                    </div>
                    <p className="text-sm text-muted-foreground">Sınav Bildirimi</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
