// app/teacher/analytics/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart3,
  Users,
  Calendar,
  Award,
  TrendingDown,
  BookOpen,
  Clock,
  UserCheck,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { http, endpoints } from "@/lib/api"

type ClassItem = {
  id: string
  name: string
  studentCount?: number
}

type TopPerformer = {
  name: string
  homeworkCompletion: number
  attendanceRate?: number
  examParticipation?: number
}

type NeedsAttentionStudent = {
  name: string
  homeworkCompletion?: number
  attendanceRate?: number
  examParticipation?: number
  reason?: string
}

type ClassInsight = {
  title: string
  description: string
  icon: string
  status?: string
}

type ExamHistoryItem = {
  id: string | number
  title: string
  date: string
  participation?: number | null
  total?: number | null
}

type ClassAnalyticsResponse = {
  classId: number
  className: string
  studentCount: number
  attendanceRate: number
  homeworkCompletionRate: number
  topPerformers: TopPerformer[]
  needsAttention: NeedsAttentionStudent[]
  classInsights: ClassInsight[]
  examHistory?: ExamHistoryItem[]
}

function isAbortError(e: any): boolean {
  const name = e?.name || ""
  const msg: string = String(e?.message || "")
  const lower = msg.toLowerCase()

  return (
    name === "AbortError" ||
    lower.includes("aborted") ||
    lower.includes("signal is aborted")
  )
}

export default function AnalyticsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [classesError, setClassesError] = useState<string | null>(null)

  const [selectedClass, setSelectedClass] = useState<string>("")
  const [analytics, setAnalytics] = useState<ClassAnalyticsResponse | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  // ==== Sınıfları Yükle ====
  useEffect(() => {
    const ctrl = new AbortController()
    ;(async () => {
      try {
        setClassesLoading(true)
        setClassesError(null)

        const res = await http.get<any>(endpoints.teacher.classes, { signal: ctrl.signal })

        const arr = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : []

        const mapped: ClassItem[] = arr.map((x: any) => ({
          id: String(x.id ?? x.classId),
          name: String(x.name ?? x.className ?? x.dersAdi ?? `Ders #${x.id ?? x.classId}`),
          studentCount: Number(x.studentCount ?? x.ogrenciSayisi ?? 0),
        }))

        setClasses(mapped)

        if (mapped.length > 0 && !selectedClass) {
          setSelectedClass(mapped[0].id)
        }
      } catch (e: any) {
        if (!isAbortError(e)) {
          console.error("[AnalyticsPage] class fetch error", e)
          setClassesError("Sınıf listesi alınamadı.")
        }
      } finally {
        setClassesLoading(false)
      }
    })()

    return () => ctrl.abort()
  }, [])

  // ==== Analiz Yükle ====
  useEffect(() => {
    if (!selectedClass) return

    const ctrl = new AbortController()

    ;(async () => {
      try {
        setAnalyticsLoading(true)
        setAnalyticsError(null)
        setAnalytics(null)

        const url = `${endpoints.teacher.analytics}?classId=${encodeURIComponent(selectedClass)}`
        const res = await http.get<any>(url, { signal: ctrl.signal })

        const data: ClassAnalyticsResponse = {
          classId: Number(res.classId ?? selectedClass),
          className:
            res.className ??
            classes.find((c) => c.id === selectedClass)?.name ??
            `Sınıf #${selectedClass}`,
          studentCount: Number(res.studentCount ?? 0),
          attendanceRate: Number(res.attendanceRate ?? 0),
          homeworkCompletionRate: Number(res.homeworkCompletionRate ?? 0),
          topPerformers: Array.isArray(res.topPerformers) ? res.topPerformers : [],
          needsAttention: Array.isArray(res.needsAttention) ? res.needsAttention : [],
          classInsights: Array.isArray(res.classInsights) ? res.classInsights : [],
          examHistory: Array.isArray(res.examHistory) ? res.examHistory : [],
        }

        setAnalytics(data)
      } catch (e: any) {
        if (!isAbortError(e)) {
          console.error("[AnalyticsPage] analytics fetch error:", e)
          setAnalyticsError("Analiz verisi alınamadı.")
        }
      } finally {
        setAnalyticsLoading(false)
      }
    })()

    return () => ctrl.abort()
  }, [selectedClass, classes])

  // ============================================
  // 🚀 PREMIUM LOADER (REHBER ÖĞRETMEN MODELİ)
  // ============================================
  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analiz verileri hazırlanıyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sınıf Analizi</h1>
          <p className="text-muted-foreground">
            Devam ve sınav katılımına göre sınıf performansını analiz edin
          </p>
        </div>

        <Select value={selectedClass} onValueChange={(val) => setSelectedClass(val)}>
          <SelectTrigger className="w-48 rounded-lg border bg-white shadow-sm">
            <SelectValue placeholder="Sınıf seçin" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {classesError && (
        <Alert variant="destructive">
          <AlertDescription>{classesError}</AlertDescription>
        </Alert>
      )}

      {analyticsError && (
        <Alert variant="destructive">
          <AlertDescription>{analyticsError}</AlertDescription>
        </Alert>
      )}

      {!analytics && !analyticsError && (
        <p className="text-sm text-muted-foreground">
          Analiz verisi bulunamadı. İlgili sınıf için henüz veri üretilmemiş olabilir.
        </p>
      )}

      {/* Overview Cards */}
      {analytics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Öğrenci Sayısı */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Öğrenci Sayısı</p>
                    <p className="text-2xl font-bold">{analytics.studentCount}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            {/* Devam Oranı */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Devam Oranı</p>
                    <p className="text-2xl font-bold text-secondary">
                      %{analytics.attendanceRate.toFixed(1)}
                    </p>
                  </div>
                  <UserCheck className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>

            {/* Ödev Tamamlama */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ödev Tamamlama</p>
                    <p className="text-2xl font-bold text-orange-600">
                      %{analytics.homeworkCompletionRate.toFixed(1)}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* En Başarılı Öğrenciler */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  En Başarılı Öğrenciler
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {analytics.topPerformers.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    Bu sınıf için henüz üst performans verisi yok.
                  </p>
                )}

                {analytics.topPerformers.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-yellow-800 text-sm">#{i + 1}</span>
                      </div>
                      <div>
                        <p
  className="
    font-medium 
    whitespace-nowrap 
    overflow-hidden 
    text-ellipsis 
    max-w-[160px]
    text-[clamp(0.8rem,3vw,1rem)]
    sm:max-w-none sm:whitespace-normal
  "
>
  {s.name}
</p>

                        <p className="text-muted-foreground text-sm">
                          Devam %{s.attendanceRate?.toFixed(1) ?? "—"}
                        </p>
                      </div>
                    </div>

                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Skor %{s.homeworkCompletion.toFixed(0)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Dikkat Gereken Öğrenciler */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Dikkat Gereken Öğrenciler
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {analytics.needsAttention.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    Bu sınıf için özel dikkat gerektiren öğrenci görünmüyor.
                  </p>
                )}

                {analytics.needsAttention.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p
  className="
    font-medium 
    whitespace-nowrap 
    overflow-hidden 
    text-ellipsis 
    max-w-[160px]
    text-[clamp(0.8rem,3vw,1rem)]
    sm:max-w-none sm:whitespace-normal
  "
>
  {s.name}
</p>
                        <p className="text-muted-foreground text-sm">{s.reason || ""}</p>
                      </div>
                    </div>

                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      Devam %{s.attendanceRate?.toFixed(1) ?? 0}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* İçgörüler */}
          <Card>
            <CardHeader>
              <CardTitle>Sınıf İçgörüleri</CardTitle>
            </CardHeader>

            <CardContent>
              {analytics.classInsights.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Bu sınıf için henüz içgörü oluşturulmamış.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.classInsights.map((ins, idx) => (
                    <div
                      key={idx}
                      className="p-4 border rounded-lg flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          <h4 className="font-medium">{ins.title}</h4>
                        </div>

                        <Badge>
  {ins.status === "Excellent"
    ? "Mükemmel"
    : ins.status === "Good"
    ? "İyi"
    : ins.status === "Bad"
    ? "Zayıf"
    : ins.status === "Warning"
    ? "Uyarı"
    : "Normal"}
</Badge>
                      </div>

                      <p className="text-muted-foreground text-sm">
  {ins.description
    ?.replace("Excellent", "Mükemmel")
    ?.replace("excellent", "mükemmel")
    ?.replace("Good", "İyi")
    ?.replace("good", "iyi")
    ?.replace("Bad", "Zayıf")
    ?.replace("bad", "zayıf")
    ?.replace("Warning", "Uyarı")
    ?.replace("warning", "uyarı")}
</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sınav Geçmişi */}
          <Card>
            <CardHeader>
              <CardTitle>Sınav Geçmişi</CardTitle>
            </CardHeader>

            <CardContent>
              {(!analytics.examHistory || analytics.examHistory.length === 0) && (
                <p className="text-muted-foreground text-sm">
                  Bu sınıf için henüz sınav geçmişi yok.
                </p>
              )}

              {analytics.examHistory?.map((exam) => (
                <div
                  key={exam.id}
                  className="flex justify-between items-center p-4 border rounded-lg mb-2"
                >
                  <div>
                    <h4 className="font-medium">{exam.title}</h4>
                    <p className="text-muted-foreground text-sm">
                      {new Date(exam.date).toLocaleDateString("tr-TR")}
                    </p>
                  </div>

                  {typeof exam.participation === "number" && (
                    <p className="text-muted-foreground text-sm">
                      Katılım: {exam.participation}/{exam.total}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
