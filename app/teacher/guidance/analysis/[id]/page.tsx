"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
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
import { ArrowLeft, Calendar, BookOpen, Users } from "lucide-react"
import { http, endpoints } from "@/lib/api"

const formatDateTime = (value?: string) => {
  if (!value) return ""

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return value
  }

  // 👇 Sadece tarih, burada da saat yok
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}


type GuidanceStudentRaw = {
  studentId?: number
  StudentId?: number
  studentName?: string
  StudentName?: string
  classId?: number
  ClassId?: number
  className?: string
  ClassName?: string
  homeworkParticipation?: number
  HomeworkParticipation?: number
  examParticipation?: number
  ExamParticipation?: number
  attendanceRate?: number
  AttendanceRate?: number
  emotionalState?: string
  EmotionalState?: string
  needsAttention?: boolean
  NeedsAttention?: boolean
  lastUpdate?: string
  LastUpdate?: string
  notes?: string
  Notes?: string
  guidanceNotes?: any[]
  GuidanceNotes?: any[]
}

export default function StudentAnalysisPage() {
  const params = useParams()
  const router = useRouter()

  const studentIdParam = params?.id as string | undefined

  const [studentData, setStudentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        if (!studentIdParam) {
          console.error("[guidance-analysis] Parametre id yok")
          setLoading(false)
          return
        }

        console.log("[guidance-analysis] route param id:", studentIdParam)

        const data: any = await http.get(endpoints.teacher.guidance)
        console.log("[guidance-analysis] raw response:", data)

        const srcArray: GuidanceStudentRaw[] = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.Students)
          ? data.Students
          : Array.isArray(data?.students)
          ? data.students
          : []

        console.log("[guidance-analysis] students length:", srcArray.length)

        const normalized = srcArray.map((s) => ({
          studentId: s.StudentId ?? s.studentId,
          studentName: s.StudentName ?? s.studentName,
          classId: s.ClassId ?? s.classId,
          className: s.ClassName ?? s.className,
          homeworkParticipation:
            s.HomeworkParticipation ?? s.homeworkParticipation ?? 0,
          examParticipation:
            s.ExamParticipation ?? s.examParticipation ?? 0,
          attendanceRate:
            s.AttendanceRate ?? s.attendanceRate ?? 0,
          emotionalState: s.EmotionalState ?? s.emotionalState ?? "stable",
          needsAttention: s.NeedsAttention ?? s.needsAttention ?? false,
          lastUpdate: s.LastUpdate ?? s.lastUpdate,
          notes: s.Notes ?? s.notes,
          guidanceNotes: s.GuidanceNotes ?? s.guidanceNotes ?? [],
        }))

        const sidStr = String(studentIdParam)
        const student = normalized.find(
          (s) => String(s.studentId) === sidStr,
        )

        if (student) {
          console.log("[guidance-analysis] found student:", student)
          setStudentData(student)
        } else {
          console.warn(
            "[guidance-analysis] Student not found with ID:",
            sidStr,
          )
        }
      } catch (error) {
        console.error("[guidance-analysis] Failed to fetch student data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [studentIdParam])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!studentData) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/teacher/guidance")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Öğrenci Bulunamadı</h1>
            {studentIdParam && (
              <p className="text-muted-foreground text-sm">
                ID: <span className="font-mono">{String(studentIdParam)}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/guidance">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Detaylı Öğrenci Analizi</h1>
          <p className="text-muted-foreground">
            {studentData.studentName} - {studentData.className}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <BookOpen className="h-5 w-5" />
      Ödev Performansı
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      Şu an geliştiriliyor
    </p>
  </CardContent>
</Card>


        <Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Calendar className="h-5 w-5" />
      Sınav Katılımı
    </CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      Şu an geliştiriliyor
    </p>
  </CardContent>
</Card>


        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Devam Durumu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              %{studentData.attendanceRate}
            </div>
            <p className="text-sm text-muted-foreground">Devam Oranı</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rehberlik Notları</CardTitle>
          <CardDescription>
            Öğrenci için eklenen tüm rehberlik notları
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentData.guidanceNotes &&
            studentData.guidanceNotes.length > 0 ? (
              studentData.guidanceNotes.map((note: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{note.area}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {note.createdAt
                        ? formatDateTime(note.createdAt)
                        : studentData.lastUpdate
                        ? formatDateTime(studentData.lastUpdate)
                        : formatDateTime(new Date().toISOString())}
                    </span>
                  </div>
                  <p className="text-sm">{note.content}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Henüz rehberlik notu eklenmemiş.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
