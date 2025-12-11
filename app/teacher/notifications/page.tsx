"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCircle, Clock, BookOpen, Users, FileText, Calendar } from "lucide-react"

type NotificationItem = {
  id: string | number
  title: string
  message: string
  date: string
  type?: string
  read: boolean
}

// Sadece teacher bildirimleri için basit userId okuyucu
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

function saveTeacherNotificationReadSet(userId: string | null, set: Set<string>) {
  if (typeof window === "undefined") return
  try {
    const key = `vbs:teacher:notifications:read:${userId || "anon"}`
    window.localStorage.setItem(key, JSON.stringify(Array.from(set)))
  } catch {
    // ignore
  }
}

function getTypeVisual(type?: string) {
  const t = (type || "announcement").toLowerCase()

  switch (t) {
    case "homework":
      return { Icon: BookOpen, color: "text-green-600", bgColor: "bg-green-50" }
    case "exam":
      return { Icon: FileText, color: "text-orange-600", bgColor: "bg-orange-50" }
    case "student":
      return { Icon: Users, color: "text-red-600", bgColor: "bg-red-50" }
    case "system":
      return { Icon: Bell, color: "text-blue-600", bgColor: "bg-blue-50" }
    case "announcement":
    default:
      return { Icon: Calendar, color: "text-emerald-600", bgColor: "bg-emerald-50" }
  }
}

export default function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadNotifications() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch("/api/vbs/teacher/notifications", { credentials: "include" })

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const data = await res.json()
        const userId = readTeacherUserId()
        const readSet = getTeacherNotificationReadSet(userId)

        // Beklenen şekil: { items: [{ id, title, message, type, date }] }
        if (data && Array.isArray(data.items)) {
          const mapped: NotificationItem[] = data.items.map((n: any) => ({
            id: n.id,
            title: String(n.title ?? ""),
            message: String(n.message ?? ""),
            date: n.date ?? n.createdAt ?? new Date().toISOString(),
            type: n.type ?? "announcement",
            read: readSet.has(String(n.id)),
          }))
          if (active) setNotifications(mapped)
        } else {
          console.warn("[teacher/notifications] Unexpected API shape:", data)
          if (active) {
            setNotifications([])
          }
        }
      } catch (e: any) {
        console.error("[teacher/notifications] Failed to load notifications:", e)
        if (active) setError(e?.message || "Bildirimler yüklenemedi.")
      } finally {
        if (active) setLoading(false)
      }
    }

    loadNotifications()
    return () => {
      active = false
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllAsRead = () => {
    const userId = readTeacherUserId()
    setNotifications((prev) => {
      const next = prev.map((notification) => ({ ...notification, read: true }))
      if (userId) {
        const set = new Set<string>()
        next.forEach((n) => set.add(String(n.id)))
        saveTeacherNotificationReadSet(userId, set)
      }
      return next
    })
  }

  const handleMarkAsRead = (id: string | number) => {
    const userId = readTeacherUserId()
    setNotifications((prev) => {
      const next = prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      )
      if (userId) {
        const set = getTeacherNotificationReadSet(userId)
        set.add(String(id))
        saveTeacherNotificationReadSet(userId, set)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bildirimler</h1>
          {loading ? (
            <p className="text-muted-foreground text-xs sm:text-sm">Bildirimler yükleniyor...</p>
          ) : error ? (
            <p className="text-red-600 text-xs sm:text-sm">Bildirimler yüklenemedi: {error}</p>
          ) : unreadCount > 0 ? (
            <p className="text-muted-foreground text-xs sm:text-sm">
  {unreadCount} okunmamış bildirim
</p>
          ) : (
            <p className="text-muted-foreground text-xs sm:text-sm">Tüm bildirimler okundu</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0 || loading}>
          Tümünü Okundu İşaretle
        </Button>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="text-sm text-muted-foreground">
            Bildirimler yükleniyor…
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Şu anda görüntülenecek bir bildirim bulunmuyor.
          </div>
        )}

        {!loading &&
          !error &&
          notifications.map((notification) => {
            const { Icon, color, bgColor } = getTypeVisual(notification.type)
            return (
              <Card
                key={notification.id}
                className={`${!notification.read ? "border-primary/50 bg-primary/5" : ""}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${bgColor}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">
  {notification.title}
</h3>
                        {!notification.read && (
                          <Badge variant="secondary" className="bg-primary text-primary-foreground">
                            Yeni
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-2 text-xs sm:text-sm">
  {notification.message}
</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs sm:text-sm">
  {new Date(notification.date).toLocaleString("tr-TR")}
</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {notification.read ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                          Okundu İşaretle
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>
    </div>
  )
}
