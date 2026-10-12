"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, Upload, BarChart3, Calendar } from "lucide-react"
import { http, endpoints } from "@/lib/api"
import { TeacherWelcomeHeader } from "@/components/teacher/TeacherWelcomeHeader"

type VbsUser = {
  id: string
  email?: string
  name?: string
  roles?: string[]
  teacherNumericId?: number
}

type TeacherClass = {
  id: string | number
  name: string
  studentCount: number
  subject?: string
  pendingHomework: number
  recentExams: number
}

type QuickStat = {
  title: string
  value: string | number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: string
  bgColor: string
}

type ClassPerformanceItem = {
  className: string
  homeworkParticipation: number
  attendanceAverage: number
  trend: "up" | "down"
  color: string
  bgColor: string
}

type DashboardNotification = {
  id: string | number
  title: string
  message: string
  date?: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: string
}

type HomeworkSummary = {
  id: number | string
  classId: number | string
  status?: string | null
  dueDate?: string | null
  submissionsCount: number
  totalStudents: number
}

type ExamSummary = {
  id: number | string
  classId: number | string
  hasAnalysis: boolean
  examDate?: string | null
}

export default function TeacherDashboardPage() {
  const router = useRouter()
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [displayName, setDisplayName] = useState<string>("Öğretmen")

  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([])
  const [quickStats, setQuickStats] = useState<QuickStat[]>([])
  const [classPerformance, setClassPerformance] = useState<ClassPerformanceItem[]>([])
  const [generalNotifications, setGeneralNotifications] = useState<DashboardNotification[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem("vbs:user") : null
      if (!raw) {
        router.replace("/login")
        return
      }

      const stored = JSON.parse(raw)
      const user: VbsUser = stored?.user ?? stored
      const roles = Array.isArray(user?.roles) ? user.roles : []

      if (!roles.includes("Teacher")) {
        router.replace("/login")
        return
      }

      const name = (user?.name || user?.email || "").trim()
      setDisplayName(name || "Öğretmen")
      setIsAuthLoading(false)
    } catch {
      router.replace("/login")
    }
  }, [router])

  useEffect(() => {
    if (isAuthLoading) return
    const ctrl = new AbortController()

    ;(async () => {
      try {
        setIsDataLoading(true)

        const raw =
          typeof window !== "undefined" ? localStorage.getItem("vbs:user") : null
        const stored = raw ? JSON.parse(raw) : null
        const user = stored?.user ?? stored

        const teacherId = Number(user?.teacherNumericId)
        if (!teacherId || Number.isNaN(teacherId)) {
          console.error("TeacherID okunamadı:", teacherId)
          return
        }

        let mappedClasses: TeacherClass[] = []
        try {
          const res = await fetch(endpoints.teacher.classes, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            signal: ctrl.signal,
          })

          if (res.ok) {
            const json = await res.json()
            const arr = Array.isArray(json)
              ? json
              : Array.isArray(json?.items)
              ? json.items
              : []

            mappedClasses = arr.map((x: any) => ({
              id: x.id ?? x.dersId ?? x.classId ?? Math.random(),
              name: String(
                x.name ??
                  x.className ??
                  x.dersAdi ??
                  `Sınıf #${x.id ?? x.classId ?? "?"}`,
              ),
              studentCount: Number(
                x.studentCount ??
                  x.ogrenciSayisi ??
                  x.ogrenciCount ??
                  0,
              ),
              subject: x.subjectName ?? x.brans ?? x.lessonName ?? "",
              pendingHomework: 0,
              recentExams: 0,
            }))
          }
        } catch (err) {
          console.error("[dashboard] teacher.classes alınırken hata:", err)
        }

        setTeacherClasses(mappedClasses)

        let perf: ClassPerformanceItem[] = []

        for (const cls of mappedClasses) {
          try {
            const url = `${endpoints.teacher.analytics}?classId=${cls.id}`
            const r = await http.get<any>(url, { signal: ctrl.signal })

            const attendanceAvg = Number(r.attendanceRate ?? 0)
            const homework = Number(r.homeworkCompletionRate ?? 0)

            const trendValue = attendanceAvg > 80 ? "up" : "down"

            perf.push({
              className: cls.name,
              homeworkParticipation: Math.round(homework),
              attendanceAverage: Math.round(attendanceAvg),
              trend: trendValue,
              color: trendValue === "up" ? "text-green-600" : "text-red-600",
              bgColor: trendValue === "up" ? "bg-green-50" : "bg-red-50",
            })
          } catch (e) {
            console.warn("[dashboard] analytics alınamadı:", cls.id, e)
          }
        }

        setClassPerformance(perf)

      let totalStudents = 0
      try {
        const totalRes = await http.get<any>(
          `${endpoints.teacher.totalStudents}?teacherId=${teacherId}`,
          { signal: ctrl.signal }
        )
        totalStudents = Number(totalRes.totalStudents || 0)
      } catch (err) {
        console.error("[dashboard] teacher.total-students hata:", err)
      }

      let homeworkItems: HomeworkSummary[] = []
      try {
        const hwRes = await fetch("/api/teacher/homework", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: ctrl.signal,
        })

        if (hwRes.ok) {
          const hwJson = await hwRes.json()
          const raw = Array.isArray(hwJson?.items)
            ? hwJson.items
            : Array.isArray(hwJson)
            ? hwJson
            : []

          homeworkItems = raw.map((h: any) => ({
            id: h.id ?? h.homeworkId ?? Math.random(),
            classId: h.classId ?? h.dersId ?? h.classroomId ?? "",
            status: h.status ?? h.state ?? null,
            dueDate: h.dueDate ?? h.deadline ?? null,
            submissionsCount: Array.isArray(h.submissions)
              ? h.submissions.length
              : Number(
                  h.submissionCount ??
                    h.submittedCount ??
                    0,
                ),
            totalStudents: Number(
              h.totalStudents ??
                h.studentCount ??
                h.ogrenciSayisi ??
                0,
            ),
          }))
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error("[dashboard] /api/teacher/homework hata:", e)
        }
      }

      let examItems: ExamSummary[] = []
      try {
        const exRes = await fetch(endpoints.teacher.exams, {

  method: "GET",
  credentials: "include",
  cache: "no-store",
  signal: ctrl.signal,
})

        if (exRes.ok) {
          const exJson = await exRes.json()
          const raw = Array.isArray(exJson)
            ? exJson
            : Array.isArray(exJson?.items)
            ? exJson.items
            : Array.isArray(exJson?.exams)
            ? exJson.exams
            : []

          examItems = raw.map((x: any) => {
            const hasAnalysis = Boolean(
              x.hasAnalysis ??
                x.analysisExists ??
                (typeof x.analysisCount === "number" &&
                  x.analysisCount > 0),
            )

            const examDate =
              x.uploadDate ??
              x.examDate ??
              x.createdAt ??
              null

            return {
              id:
                x.id ??
                x.examId ??
                x.generalExamId ??
                Math.random(),
              classId: x.classId ?? x.dersId ?? x.classroomId ?? "",
              hasAnalysis,
              examDate,
            }
          })
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error("[dashboard] /api/teacher/exams hata:", e)
        }
      }

      const today = new Date()
      const activeHomeworkCount = homeworkItems.filter((hw) => {
        if (!hw.classId) return false
        const due = hw.dueDate ? new Date(hw.dueDate) : null
        const isActiveStatus =
          hw.status === "active" ||
          hw.status === "Aktif" ||
          hw.status === "ONGOING"
        return (
          isActiveStatus ||
          (due !== null && due.getTime() >= today.getTime())
        )
      }).length

      const pendingExamsCount = examItems.filter(
        (ex) => !ex.hasAnalysis,
      ).length

      setQuickStats([
        {
          title: "Toplam Öğrenci",
          value: totalStudents,
          icon: Users,
          color: "text-secondary",
          bgColor: "bg-secondary/10",
        },
        {
          title: "Aktif Ödev",
          value: activeHomeworkCount,
          icon: BookOpen,
          color: "text-primary",
          bgColor: "bg-primary/10",
        },
        {
          title: "Bekleyen Sınav",
          value: pendingExamsCount,
          icon: Upload,
          color: "text-orange-600",
          bgColor: "bg-orange-100",
        },
      ])

      try {
        const notRes = await http.get<any>(
          endpoints.teacher.notifications,
          { signal: ctrl.signal },
        )

        const items = Array.isArray(notRes)
          ? notRes
          : Array.isArray(notRes?.items)
          ? notRes.items
          : []

        const mappedNotifications: DashboardNotification[] =
          items.map((n: any) => ({
            id: n.id ?? n.notificationId ?? Math.random(),
            title: String(n.title ?? n.subject ?? "Duyuru"),
            message: String(n.message ?? n.body ?? ""),
            date:
              n.date ??
              n.createdAt ??
              n.sentAt ??
              undefined,
            icon: Calendar,
            color: "text-blue-600",
          }))

        setGeneralNotifications(
  mappedNotifications
    .sort((a, b) => {
      const d1 = new Date(a.date || 0).getTime()
      const d2 = new Date(b.date || 0).getTime()
      return d2 - d1
    })
    .slice(0, 3)
)

      } catch (err) {
        console.error(
          "[dashboard] teacher.notifications alınırken hata:",
          err,
        )
      }
    } finally {
      setIsDataLoading(false)
    }
  })()

  return () => ctrl.abort()
}, [isAuthLoading])

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <TeacherWelcomeHeader displayName={displayName} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickStats.map((stat, i) => (
          <Card
            key={i}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon
                    className={`h-6 w-6 ${stat.color}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Sınıflarım
            </h2>
            <Link href="/teacher/classes">
              <Button variant="outline" size="sm">
                Tümünü Gör
              </Button>
            </Link>
          </div>

          {isDataLoading && !teacherClasses.length ? (
            <div className="text-sm text-muted-foreground">
              Sınıf verileri yükleniyor…
            </div>
          ) : teacherClasses.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Henüz size atanmış bir sınıf bulunmuyor.
            </div>
          ) : (
            <div className="space-y-4">
              {teacherClasses.map((c) => (
                <Card
                  key={c.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
  
  {/* Icon */}
  <div className="p-3 rounded-full bg-primary/10">
    <Users className="h-8 w-8 text-primary" />
  </div>

  {/* Content */}
  <div className="flex-1 min-w-0">

    {/* Title + Badge */}
    <div className="flex items-center gap-2 mb-2 min-w-0">

      <h3
        className="
          font-semibold text-foreground
          whitespace-nowrap overflow-hidden tracking-tight
          text-[clamp(0.9rem,3.5vw,1.1rem)]
        "
      >
        {c.name}
      </h3>

      <Badge
        variant="secondary"
        className="inline-flex items-center whitespace-nowrap"
      >
        {c.studentCount} öğrenci
      </Badge>

      {c.subject && (
        <Badge variant="outline" className="ml-1 whitespace-nowrap">
          {c.subject}
        </Badge>
      )}
    </div>

    {/* Bekleyen ödev */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4">
      <div className="flex items-center gap-1">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Bekleyen:</span>
        <span
          className={`font-medium ${
            c.pendingHomework > 0
              ? "text-orange-600"
              : "text-green-600"
          }`}
        >
          {c.pendingHomework} ödev
        </span>
      </div>
    </div>

    {/* Buttons */}
    <div className="grid grid-cols-3 gap-2">

  {/* Ödev Ver */}
  <Link href={`/teacher/homework?class=${c.id}`}>
    <Button
      variant="outline"
      size="sm"
      className="
        w-full px-2 py-2 
        flex items-center justify-center gap-1 
        text-[clamp(0.55rem,2.2vw,0.75rem)] 
        whitespace-nowrap
      "
    >
      <BookOpen className="h-3 w-3" />
      Ödev Ver
    </Button>
  </Link>

  {/* Sınav Yükle */}
  <Link href={`/teacher/exam-upload?class=${c.id}`}>
    <Button
      variant="outline"
      size="sm"
      className="
        w-full px-2 py-2 
        flex items-center justify-center gap-1 
        text-[clamp(0.55rem,2.2vw,0.75rem)] 
        whitespace-nowrap
      "
    >
      <Upload className="h-3 w-3" />
      Sınav Yükle
    </Button>
  </Link>

  {/* Analiz */}
  <Link href={`/teacher/analytics?class=${c.id}`}>
    <Button
      variant="outline"
      size="sm"
      className="
        w-full px-2 py-2 
        flex items-center justify-center gap-1 
        text-[clamp(0.55rem,2.2vw,0.75rem)] 
        whitespace-nowrap
      "
    >
      <BarChart3 className="h-3 w-3" />
      Analiz
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

        {/* Right Column */}
        <div className="space-y-6">
          {/* Class Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Sınıf Performans Özeti
              </CardTitle>
              <CardDescription>
                Sınıflarınızın genel başarı durumu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
  {classPerformance.map((p, i) => (
    <div
      key={i}
      className={`p-4 rounded-lg border ${p.bgColor}`}
    >
      <div className="flex items-center justify-between mb-3 gap-2 min-w-0">

  {/* Sınıf Adı */}
  <h4
    className="
      font-medium text-foreground
      whitespace-nowrap overflow-hidden tracking-tight
      text-[clamp(0.9rem,3vw,1.1rem)]
      max-w-[70%]
    "
  >
    {p.className}
  </h4>

  {/* Sağdaki İkon Alanı */}
  <div className="flex items-center gap-2 flex-shrink-0">
    <BarChart3 className={`h-4 w-4 ${p.color}`} />
    <span className={`text-sm font-medium ${p.color}`}>
      {p.trend === "up" ? "↗" : "↘"}
    </span>
  </div>

</div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xl font-bold text-foreground">
            %{p.homeworkParticipation}
          </p>
          <p className="text-xs text-muted-foreground">
            Ödev Katılımı
          </p>
        </div>

        <div>
          <p className="text-xl font-bold text-foreground">
            %{p.attendanceAverage}
          </p>
          <p className="text-xs text-muted-foreground">
            Devam Oranı
          </p>
        </div>
      </div>
    </div>
  ))}

  {!classPerformance.length && (
    <p className="text-sm text-muted-foreground">
      Henüz performans verisi bulunmuyor. Sınıflarınızda ödev ve sınavlar
      oluştukça burası dolacak.
    </p>
  )}
</CardContent>

          </Card>

          {/* Genel Duyurular */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Genel Duyurular
              </CardTitle>
              <CardDescription>
                Okul yönetimi tarafından gönderilen güncel duyurular
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {generalNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Şu anda gösterilecek bir duyuru bulunmuyor.
                </p>
              ) : (
                generalNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <n.icon
  className={`h-4 w-4 mt-0.5 flex-shrink-0 ${n.color}`}
/>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {n.message}
                      </p>
                      {n.date && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {new Date(
                            n.date,
                          ).toLocaleDateString("tr-TR")}
                        </p>
                      )}
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
