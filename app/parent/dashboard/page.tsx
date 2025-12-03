"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { User, Calendar, BookOpen, FileText, Clock } from "lucide-react"
import Link from "next/link"

/* ================== TYPES ================== */

type VbsUser = {
  id: string
  name?: string
  email?: string
  roles?: string[]
}

type ApiStudent = {
  id: number | string
  name?: string
  fullName?: string
  class?: string
  className?: string
  branch?: string
  photo?: string
  attendance?: number
  pendingHomework?: number
  lastExam?: string
}

type UiStudent = {
  id: string
  name: string
  class: string
  branch?: string
  photo?: string
  attendance: number
  pendingHomework: number
  lastExam?: string
}

type ApiNotification = {
  id: string | number
  title: string
  message: string
  type?: string
  date: string
}

type UiNotification = {
  id: string
  title: string
  message: string
  type: "holiday" | "announcement"
  date: string
}

/* ================== HELPERS ================== */

function parseStoredUser(raw: string | null): VbsUser | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw)
    return (v.user ?? v) as VbsUser
  } catch {
    return null
  }
}

function getDisplayName(user: VbsUser | null) {
  return (user?.name || user?.email || "Kullanıcı").trim()
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 1) return (parts[0][0] || "U").toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function normalizeStudent(x: ApiStudent): UiStudent {
  return {
    id: String(x.id ?? ""),
    name: String(x.name ?? x.fullName ?? "Öğrenci"),
    class: String(x.class ?? x.className ?? "-"),
    branch: x.branch,
    photo: x.photo,
    attendance: typeof x.attendance === "number" ? x.attendance : 0,
    pendingHomework:
      typeof x.pendingHomework === "number" ? x.pendingHomework : 0,
    lastExam: x.lastExam,
  }
}

function normalizeNotification(n: ApiNotification): UiNotification {
  return {
    id: String(n.id),
    title: n.title,
    message: n.message,
    type: n.type === "holiday" ? "holiday" : "announcement",
    date: n.date,
  }
}

/* ================== MAIN COMPONENT ================== */

export default function ParentDashboardPage() {
  const router = useRouter()

  const [user, setUser] = useState<VbsUser | null>(null)
  const [students, setStudents] = useState<UiStudent[]>([])
  const [notifications, setNotifications] = useState<UiNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* -------- AUTH GUARD -------- */

  useEffect(() => {
    const raw = localStorage.getItem("vbs:user")
    const u = parseStoredUser(raw)
    const roles = Array.isArray(u?.roles) ? u!.roles : []

    if (!u || !roles.includes("Parent")) {
      router.replace("/login")
      return
    }

    setUser(u)
  }, [router])

  /* -------- LOAD DATA -------- */

  useEffect(() => {
    if (!user) return

    const ac = new AbortController()

    ;(async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [sRes, nRes] = await Promise.all([
          fetch(`/api/parent/students`, {
            credentials: "include",
            signal: ac.signal,
          }),
          fetch(`/api/parent/notifications`, {
            credentials: "include",
            signal: ac.signal,
          }),
        ])

        if (sRes.status === 401) {
          router.replace("/login")
          return
        }

        const sJson = await sRes.json()
        const nJson = nRes.ok ? await nRes.json() : { items: [] }

        let sItemsRaw: any[] = []

        if (Array.isArray(sJson.items)) sItemsRaw = sJson.items
        else if (Array.isArray(sJson.data)) sItemsRaw = sJson.data
        else if (Array.isArray(sJson)) sItemsRaw = sJson
        else sItemsRaw = []

        const sItems: ApiStudent[] = sItemsRaw as ApiStudent[]

        const nItems: ApiNotification[] = Array.isArray(nJson.items)
          ? nJson.items
          : Array.isArray(nJson)
          ? (nJson as ApiNotification[])
          : []

        setStudents(sItems.map(normalizeStudent))
        setNotifications(nItems.map(normalizeNotification))
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setError("Veriler yüklenirken bir hata oluştu.")
        }
      } finally {
        setIsLoading(false)
      }
    })()

    return () => ac.abort()
  }, [user, router])

  /* -------- DERIVED VALUES -------- */

  const displayName = getDisplayName(user)
  const initials = getInitials(displayName)

  const quickStats = useMemo(() => {
    const totalStudents = students.length
    const pending = students.reduce((a, s) => a + s.pendingHomework, 0)
    const avgAtt =
      students.length > 0
        ? Math.round(
            students.reduce((a, s) => a + s.attendance, 0) / students.length,
          )
        : 0

    return [
      {
        title: "Toplam Öğrenci",
        value: totalStudents,
        icon: User,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Bekleyen Ödev",
        value: pending,
        icon: BookOpen,
        color: "text-orange-600",
        bg: "bg-orange-100",
      },
      {
        title: "Ortalama Devam Oranı",
        value: `${avgAtt}%`,
        icon: Calendar,
        color: "text-red-600",
        bg: "bg-red-100",
      },
    ]
  }, [students])

  const latestNotifications = useMemo(() => {
    if (!notifications.length) return []
    return [...notifications]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime(),
      )
      .slice(0, 3)
  }, [notifications])

  /* ================== PREMIUM LOADER ================== */

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-50">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">
          Anasayfa yükleniyor...
        </p>
      </div>
    )
  }

  /* ================== UI ================== */

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-lg p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16 animate-pulse" />

        <div className="relative z-10 flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src="/parent-avatar.png" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div>
            <h1 className="text-2xl font-bold">
              Hoş geldiniz, {displayName}
            </h1>
            <p className="text-muted-foreground text-sm">
              Çocuğunuzun akademik durumunu kolayca takip edin.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((s, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {s.title}
                  </p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
                <div className={`p-3 rounded-full ${s.bg}`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students */}

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Öğrencilerim</h2>

          {students.length === 0 ? (
            <Alert>
              <AlertDescription>
                Öğrenci verisi bulunamadı.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {students.map((st) => (
                <Card key={st.id} className="hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={st.photo || "/placeholder.svg"} />
                        <AvatarFallback>
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base">
                            {st.name}
                          </h3>
                          <Badge variant="secondary">
                            {st.class}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            Devamsızlık:
                            <span
                              className={
                                st.attendance >= 90
                                  ? "text-green-600"
                                  : "text-orange-600"
                              }
                            >
                              %{st.attendance}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            Bekleyen:
                            <span
                              className={
                                st.pendingHomework > 0
                                  ? "text-orange-600"
                                  : "text-green-600"
                              }
                            >
                              {st.pendingHomework} ödev
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Link href={`/parent/attendance?student=${st.id}`}>
                            <Button variant="outline" size="sm">
                              <Calendar className="h-4 w-4 mr-1" />
                              Devamsızlık
                            </Button>
                          </Link>

                          <Link href={`/parent/homework?student=${st.id}`}>
                            <Button variant="outline" size="sm">
                              <BookOpen className="h-4 w-4 mr-1" />
                              Ödevler
                            </Button>
                          </Link>

                          <Link href={`/parent/exam-results?student=${st.id}`}>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-1" />
                              Sınavlar
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Son Aktiviteler</h2>
            <Link href="/parent/notifications">
              <Button size="sm" variant="outline">
                Tümünü Gör
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Güncel Bildirimler</CardTitle>
              <CardDescription>Son eklenen duyuru ve tatiller</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {latestNotifications.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Bildirim bulunamadı.
                  </AlertDescription>
                </Alert>
              ) : (
                latestNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 p-3 hover:bg-accent/40 rounded-lg transition border border-border/60"
                  >
                    <div className="p-2 bg-accent/30 rounded-full">
                      {n.type === "holiday" ? (
                        <Calendar className="h-4 w-4 text-green-600" />
                      ) : (
                        <User className="h-4 w-4 text-blue-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(n.date).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
