"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  Bell,
  BellRing,
  Calendar,
  AlertTriangle,
  BookOpen,
  Users,
  CheckCircle2,
  Circle,
} from "lucide-react"

type NotificationType =
  | "homework"
  | "exam"
  | "grade"
  | "announcement"
  | "holiday"
  | "event"
  | "warning"

interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  date: string
  isRead: boolean
}

const STORAGE_KEY = "vbs:parent_notifications_read"

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "homework":
      return <BookOpen className="h-5 w-5" />
    case "exam":
      return <BookOpen className="h-5 w-5" />
    case "grade":
      return <CheckCircle2 className="h-5 w-5" />
    case "announcement":
      return <Bell className="h-5 w-5" />
    case "holiday":
      return <Calendar className="h-5 w-5" />
    case "event":
      return <Users className="h-5 w-5" />
    case "warning":
      return <AlertTriangle className="h-5 w-5" />
    default:
      return <Bell className="h-5 w-5" />
  }
}

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case "homework":
      return "border-l-blue-500"
    case "exam":
      return "border-l-orange-500"
    case "grade":
      return "border-l-green-500"
    case "announcement":
      return "border-l-blue-500"
    case "holiday":
      return "border-l-green-500"
    case "event":
      return "border-l-purple-500"
    case "warning":
      return "border-l-red-500"
    default:
      return "border-l-gray-500"
  }
}

const getTypeLabel = (type: NotificationType) => {
  switch (type) {
    case "homework":
      return "Ödev"
    case "exam":
      return "Sınav"
    case "grade":
      return "Not"
    case "announcement":
      return "Duyuru"
    case "holiday":
      return "Tatil"
    case "event":
      return "Etkinlik"
    case "warning":
      return "Uyarı"
    default:
      return "Bildirim"
  }
}

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.map((x: any) => String(x)))
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)))
  } catch {
    // yut
  }
}

export default function ParentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  )
  const totalCount = useMemo(() => notifications.length, [notifications])

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    try {
      setLoading(true)
      setError(null)

      // Proxy route → Next.js API → Backend
      const res = await fetch("/api/parent/notifications", {
        credentials: "include",
      })

      const json = await res.json().catch(() => ({} as any))

      if (!res.ok) {
        const errMsg =
          (json as any)?.error || `Bildirimler alınamadı (HTTP ${res.status}).`
        throw new Error(errMsg)
      }

      // API { items: [...] } veya doğrudan [...] dönebilir
      const arr: Notification[] = Array.isArray((json as any)?.items)
        ? (json as any).items
        : Array.isArray(json)
        ? (json as any)
        : []

      const errMsg = (json as any)?.error
      if (errMsg && arr.length === 0) {
        setError(errMsg)
      } else {
        setError(null)
      }

      // 🔒 Okunmuş bildirimleri localStorage'dan çek
      const readIds = loadReadIds()

      const merged = arr.map((n) => ({
        ...n,
        isRead: n.isRead || readIds.has(String(n.id)),
      }))

      setNotifications(merged)
   } catch (e: any) {
  toast.error(e?.message || "Bildirimler yüklenemedi.", {
    duration: 2500,
    position: "bottom-right",
  })

  setError(e?.message || "Bildirimler yüklenemedi.")
  setNotifications([])
} finally {
  setLoading(false)
}

  }

  // Okundu/okunmadı bilgisi localStorage ile kalıcı
  function markAllAsRead() {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true }))
      const ids = new Set(updated.map((n) => n.id))
      saveReadIds(ids)
      return updated
    })
  }

  function toggleNotificationRead(id: string) {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, isRead: !n.isRead } : n,
      )

      const ids = loadReadIds()
      const target = updated.find((n) => n.id === id)

      if (target?.isRead) {
        ids.add(id)
      } else {
        ids.delete(id)
      }

      saveReadIds(ids)
      return updated
    })
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center">
          <p className="text-foreground">Yükleniyor...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BellRing className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Bildirimler
                </h1>
                <p className="text-muted-foreground">
                  Okul duyuruları ve önemli bilgiler
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-primary">{unreadCount}</span>{" "}
                okunmamış
              </div>
              <Button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="bg-primary hover:bg-primary/90"
              >
                Tümünü İşaretle
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all duration-200 hover:shadow-md cursor-pointer border-l-4 ${getNotificationColor(
                  notification.type,
                )} ${
                  !notification.isRead
                    ? "bg-blue-50/50 border-blue-200"
                    : "bg-background"
                }`}
                onClick={() => toggleNotificationRead(notification.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          !notification.isRead ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle
                            className={`text-lg ${
                              !notification.isRead
                                ? "text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {notification.title}
                          </CardTitle>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(notification.type)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(notification.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.isRead ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p
                    className={`text-base leading-relaxed ${
                      !notification.isRead
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {notification.message}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-8 bg-muted/50">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {totalCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Toplam Bildirim
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {unreadCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Okunmamış
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {totalCount - unreadCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Okunmuş
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
