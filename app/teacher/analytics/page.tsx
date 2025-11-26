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
  // backend: genel skor (devam ağırlıklı, sınav küçük katsayı)
  homeworkCompletion: number
  // ekstra alanlar: devam + sınav katılımı
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

// Ortak: Abort / navigation kaynaklı hataları tespit eden helper
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

  // ==== Sınıf listesini backend'den çek ====
  useEffect(() => {
    const ctrl = new AbortController()
    ;(async () => {
      try {
        setClassesLoading(true)
        setClassesError(null)

        const res = await http.get<any>(endpoints.teacher.classes, {
          signal: ctrl.signal,
        })

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
        if (isAbortError(e)) {
          console.warn("[AnalyticsPage] classes fetch aborted:", e)
          return
        }
        console.error("[AnalyticsPage] classes fetch error:", e)
        setClassesError("Sınıf listesi alınamadı.")
      } finally {
        setClassesLoading(false)
      }
    })()

    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ==== Seçili sınıf için analitik veriyi çek ====
    // ==== Seçili sınıf için analitik veriyi çek ====
  useEffect(() => {
    if (!selectedClass) return

    const ctrl = new AbortController()
    ;(async () => {
      try {
        setAnalyticsLoading(true)
        setAnalyticsError(null)
        setAnalytics(null)

        const url = `${endpoints.teacher.analytics}?classId=${encodeURIComponent(
          selectedClass,
        )}`
        const res = await http.get<any>(url, { signal: ctrl.signal })

        const data: ClassAnalyticsResponse = {
          classId: Number(res.classId ?? selectedClass),
          className:
            res.className ??
            classes.find((c) => c.id === selectedClass)?.name ??
            `Sınıf #${selectedClass}`,
          studentCount: Number(
            res.studentCount ??
              classes.find((c) => c.id === selectedClass)?.studentCount ??
              0,
          ),
          attendanceRate: Number(res.attendanceRate ?? 0),
          homeworkCompletionRate: Number(res.homeworkCompletionRate ?? 0),
          topPerformers: Array.isArray(res.topPerformers) ? res.topPerformers : [],
          needsAttention: Array.isArray(res.needsAttention) ? res.needsAttention : [],
          classInsights: Array.isArray(res.classInsights) ? res.classInsights : [],
          examHistory: Array.isArray(res.examHistory) ? res.examHistory : [],
        }

        setAnalytics(data)
      } catch (e: any) {
        if (isAbortError(e)) {
          if (process.env.NODE_ENV !== "production") {
            console.debug("[AnalyticsPage] analytics fetch aborted")
          }
          return
        }

        console.error("[AnalyticsPage] analytics fetch error:", e)
        setAnalyticsError("Analiz verisi alınamadı.")
        setAnalytics(null)
      } finally {
        setAnalyticsLoading(false)
      }
    })()

    return () => ctrl.abort()
  }, [selectedClass, classes])


  const getInsightIcon = (iconType: string) => {
    switch (iconType) {
      case "homework":
        return <BookOpen className="h-5 w-5 text-blue-600" />
      case "exam":
        return <BarChart3 className="h-5 w-5 text-green-600" />
      case "attendance":
        return <UserCheck className="h-5 w-5 text-purple-600" />
      case "trend":
        return <Clock className="h-5 w-5 text-orange-600" />
      default:
        return <BarChart3 className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "excellent":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Mükemmel
          </Badge>
        )
      case "good":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            İyi
          </Badge>
        )
      case "warning":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            Dikkat
          </Badge>
        )
      default:
        return <Badge variant="secondary">Normal</Badge>
    }
  }

  const examHistory: ExamHistoryItem[] = analytics?.examHistory ?? []

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

        <Select
  value={selectedClass}
  onValueChange={(val) => setSelectedClass(val)}
>
  <SelectTrigger
    className="
      w-48 
      rounded-lg 
      border 
      border-gray-300 
      bg-white 
      shadow-sm 
      text-foreground
      focus:ring-0
      focus:border-gray-400
    "
  >
    <SelectValue
      placeholder={
        classesLoading ? "Sınıflar yükleniyor..." : "Sınıf seçin"
      }
    />
  </SelectTrigger>

  <SelectContent
    className="
      rounded-lg
      border 
      border-gray-300 
      bg-white 
      shadow-md
    "
  >
    {classes.map((classItem) => (
      <SelectItem
        key={classItem.id}
        value={classItem.id}
        className="
          cursor-pointer 
          rounded-md
          text-foreground 
          hover:bg-gray-100
          focus:bg-gray-100
        "
      >
        {classItem.name}
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

      {!analyticsLoading && !analytics && !analyticsError && (
        <p className="text-sm text-muted-foreground">
          Analiz verisi bulunamadı. İlgili sınıf için henüz veri üretilmemiş olabilir.
        </p>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Öğrenci Sayısı
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics?.studentCount ?? "-"}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Devam Oranı
                </p>
                <p className="text-2xl font-bold text-secondary">
                  {typeof analytics?.attendanceRate === "number"
                    ? `%${analytics.attendanceRate.toFixed(1)}`
                    : "-"}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ödev Tamamlama
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {typeof analytics?.homeworkCompletionRate === "number"
                    ? `%${analytics.homeworkCompletionRate.toFixed(1)}`
                    : "-"}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              En Başarılı Öğrenciler
            </CardTitle>
            <CardDescription>
              Devam ve sınav katılımına göre öne çıkan öğrenciler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsLoading && (
              <p className="text-sm text-muted-foreground">Yükleniyor…</p>
            )}
            {!analyticsLoading &&
              analytics?.topPerformers?.map((student, index) => {
                const attendance =
                  typeof student.attendanceRate === "number"
                    ? student.attendanceRate
                    : student.homeworkCompletion

                const exam =
                  typeof student.examParticipation === "number"
                    ? student.examParticipation
                    : undefined

                const score =
                  typeof student.homeworkCompletion === "number"
                    ? student.homeworkCompletion
                    : attendance

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-yellow-800">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {student.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Devam: %{attendance.toFixed(1)}
                          {typeof exam === "number" && (
                            <> · Sınav: %{exam.toFixed(1)}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Skor: %{score.toFixed(0)}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            {!analyticsLoading &&
              (!analytics?.topPerformers ||
                analytics.topPerformers.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  Bu sınıf için henüz üst performans verisi yok.
                </p>
              )}
          </CardContent>
        </Card>

        {/* Students Needing Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Dikkat Gereken Öğrenciler
            </CardTitle>
            <CardDescription>
              Özellikle devamsızlık ve sınav katılımına göre riskli görülen öğrenciler
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsLoading && (
              <p className="text-sm text-muted-foreground">Yükleniyor…</p>
            )}
            {!analyticsLoading &&
              analytics?.needsAttention?.map((student, index) => {
                const attendance =
                  typeof student.attendanceRate === "number"
                    ? student.attendanceRate
                    : student.homeworkCompletion ?? 0

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {student.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student.reason || "Dikkat gerektiren durum"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        Devam: %{attendance.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            {!analyticsLoading &&
              (!analytics?.needsAttention ||
                analytics.needsAttention.length === 0) && (
                <p className="text-sm text-muted-foreground">
                  Bu sınıf için özel dikkat gerektiren öğrenci görünmüyor.
                </p>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Class Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sınıf İçgörüleri
          </CardTitle>
          <CardDescription>
            Sınıfın genel durumu ve performans analizi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsLoading && (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          )}
          {!analyticsLoading && analytics?.classInsights?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.classInsights.map((insight, index) => (
                <div
                  key={index}
                  className="p-4 border border-border rounded-lg flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.icon)}
                      <h4 className="font-medium text-foreground">
                        {insight.title}
                      </h4>
                    </div>
                    {getStatusBadge(insight.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            !analyticsLoading && (
              <p className="text-sm text-muted-foreground">
                Bu sınıf için henüz içgörü oluşturulmamış.
              </p>
            )
          )}
        </CardContent>
      </Card>

      {/* Exam History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sınav Geçmişi
          </CardTitle>
          <CardDescription>Geçmiş sınavların listesi</CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsLoading && (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          )}
          {!analyticsLoading && examHistory.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Bu sınıf için henüz sınav geçmişi bulunmuyor.
            </p>
          )}
          {!analyticsLoading && examHistory.length > 0 && (
            <div className="space-y-4">
              {examHistory.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-foreground">
                      {exam.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(exam.date).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  {typeof exam.participation === "number" &&
                    typeof exam.total === "number" && (
                      <p className="text-sm text-muted-foreground">
                        Katılım: {exam.participation}/{exam.total}
                      </p>
                    )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
