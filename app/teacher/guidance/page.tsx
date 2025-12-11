"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  UserCheck,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Users,
  MessageSquare,
} from "lucide-react"
import { http, endpoints } from "@/lib/api"

// 🔹 Tek tek rehberlik notu tipi
type GuidanceNote = {
  id: string
  area: string
  content: string
  date: string
  createdBy?: string | null
  isForParent?: boolean
}

// 🔹 Öğrenci tipi + rehberlik notları
type GuidanceStudent = {
  id: string
  name: string
  classId: number
  className: string
  homeworkParticipation: number
  examParticipation: number
  attendanceRate: number
  emotionalState: string
  needsAttention: boolean
  lastUpdate: string
  notes: string
  guidanceNotes: GuidanceNote[]
}

const developmentAreas = [
  "Ödev Takibi",
  "Sınav Katılımı",
  "Devam Durumu",
  "Sosyal Beceriler",
  "Duygusal Zeka",
  "Davranış Kontrolü",
  "İletişim Becerileri",
  "Özgüven",
  "Motivasyon",
  "Stres Yönetimi",
]

// Yerel tarih/saat formatlayıcı
const formatDateTime = (value?: string) => {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value

  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default function GuidancePage() {
  const router = useRouter()

  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false)
  const [isParentNoteDialogOpen, setIsParentNoteDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedArea, setSelectedArea] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [parentNoteContent, setParentNoteContent] = useState("")
  const [filterStatus, setFilterStatus] =
    useState<"all" | "attention" | "stable">("all")

  const [studentsData, setStudentsData] = useState<GuidanceStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  
  const PAGE_SIZE = 5
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchStudentsData()
  }, [])

  const fetchStudentsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const data: any = await http.get(endpoints.teacher.guidance)
      

      const src: any[] = Array.isArray(data?.Students)
        ? data.Students
        : Array.isArray(data?.students)
        ? data.students
        : Array.isArray(data?.items)
        ? data.items
        : []

      const mapped: GuidanceStudent[] = src.map((student: any) => {
        const rawClassIdCandidate =
          student.ClassId ??
          student.classId ??
          student.Grade ??
          student.grade ??
          student.Sinif ??
          student.sinif ??
          0

        let classIdNum = Number(rawClassIdCandidate) || 0

        const rawClassName =
          student.ClassName ??
          student.className ??
          student.GradeName ??
          student.gradeName ??
          student.SinifName ??
          student.sinifName ??
          rawClassIdCandidate

        let classNameStr = "Sınıf bilgisi yok"

        if (rawClassName != null && rawClassName !== "") {
          const text = String(rawClassName).trim()
          classNameStr = text.includes("Sınıf") ? text : `${text}. Sınıf`
        } else if (classIdNum > 0) {
          classNameStr = `${classIdNum}. Sınıf`
        }

        if (classIdNum === 0 && classNameStr && classNameStr !== "Sınıf bilgisi yok") {
          const m = classNameStr.match(/^(\d+)/)
          if (m) {
            const parsed = Number(m[1])
            if (!Number.isNaN(parsed)) {
              classIdNum = parsed
            }
          }
        }

        const rawNotes =
          (Array.isArray(student.guidanceNotes) && student.guidanceNotes) ||
          (Array.isArray(student.GuidanceNotes) && student.GuidanceNotes) ||
          []

        const guidanceNotes: GuidanceNote[] = rawNotes.map((n: any) => ({
          id: String(n.id ?? n.Id),
          area: String(n.area ?? n.Area ?? ""),
          content: String(n.content ?? n.Content ?? ""),
          date: String(n.createdAt ?? n.CreatedAt ?? ""),
          createdBy: n.createdBy ?? n.CreatedBy ?? null,
          isForParent: Boolean(n.isForParent ?? n.IsForParent ?? false),
        }))

        const latestNoteDate =
          guidanceNotes.length > 0 ? guidanceNotes[0].date : undefined

        const lastUpdateVal =
          latestNoteDate ??
          student.LastUpdate ??
          student.lastUpdate ??
          new Date().toISOString()

        return {
          id: String(student.StudentId ?? student.studentId ?? student.id),
          name: String(
            student.StudentName ??
              student.studentName ??
              student.name ??
              "",
          ),
          classId: classIdNum,
          className: classNameStr,
          homeworkParticipation: Number(
            student.HomeworkParticipation ??
              student.homeworkParticipation ??
              0,
          ),
          examParticipation: Number(
            student.ExamParticipation ??
              student.examParticipation ??
              0,
          ),
          attendanceRate: Number(
            student.AttendanceRate ??
              student.attendanceRate ??
              0,
          ),
          emotionalState: String(
            student.EmotionalState ??
              student.emotionalState ??
              "stable",
          ),
          needsAttention: Boolean(
            student.NeedsAttention ??
              student.needsAttention ??
              false,
          ),
          lastUpdate: String(lastUpdateVal),
          notes: String(
            student.Notes ??
              student.notes ??
              "Bu öğrenci için henüz detaylı rehberlik analizi hesaplanmadı.",
          ),
          guidanceNotes,
        }
      })

      
      setStudentsData(mapped)
    } catch (e: any) {
      console.error("[guidance] fetch error:", e)
      setError(e?.message || "Öğrenci verileri alınırken hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  // 🔹 SINIF SEÇENEKLERİ
  const classOptions = Array.from(
    studentsData.reduce((map, s) => {
      if (s.classId > 0 && !map.has(s.classId)) {
        map.set(s.classId, s.className)
      }
      return map
    }, new Map<number, string>()),
  )
    .map(([id, name]) => ({ id: String(id), name }))
    .sort((a, b) => Number(a.id) - Number(b.id))

  // 🧠 Filtrelenmiş tüm öğrenciler
  const filteredStudents = studentsData.filter((student) => {
    if (
      selectedClass &&
      selectedClass !== "_all" &&
      String(student.classId) !== selectedClass
    ) {
      return false
    }

    if (filterStatus === "all") return true
    if (filterStatus === "attention") return student.needsAttention
    if (filterStatus === "stable") return !student.needsAttention

    return true
  })

  // ⭐ PAGINATION CALC
  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / PAGE_SIZE),
  )
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE

  const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

  const getOverallStats = () => {
    const total = filteredStudents.length
    const needsAttention = filteredStudents.filter((s) => s.needsAttention)
      .length
    const stable = total - needsAttention
    return { total, needsAttention, stable }
  }

  const stats = getOverallStats()

  const handleAddNote = async () => {
  try {
    let createdByName: string | null = null

    try {
      const raw = localStorage.getItem("vbs:user")
      if (raw) {
        const u = JSON.parse(raw)
        createdByName =
          u?.displayName ||
          u?.name ||
          `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() ||
          null
      }
    } catch {}

    await http.post(endpoints.teacher.guidance, {
      studentId: Number(selectedStudent),
      classId: selectedClass ? Number(selectedClass) : null,
      area: selectedArea,
      content: noteContent,
      createdByName,
    })

    toast.success("Rehberlik notu başarıyla eklendi!", {
      duration: 2000,
      position: "bottom-right",
    })

    await fetchStudentsData()
  } catch (error) {
    console.error("[guidance] Error adding guidance note:", error)

    toast.error("Rehberlik notu eklenirken bir hata oluştu!", {
      duration: 2500,
      position: "bottom-right",
    })
  }

  setIsAddNoteDialogOpen(false)
  setSelectedStudent("")
  setSelectedClass("")
  setSelectedArea("")
  setNoteContent("")
}


  const handleParentNote = async () => {
    try {
      if (!selectedStudent) {
        alert("Lütfen bir öğrenci seçin.")
        return
      }

      await http.post(endpoints.teacher.guidanceParentNote, {
        studentId: Number(selectedStudent),
        content: parentNoteContent,
      })

      await fetchStudentsData()

      alert("Veliye not başarıyla kaydedildi!")
    } catch (error) {
      console.error("[guidance] Error sending parent note:", error)
      alert("Veli notu kaydedilirken bir hata oluştu!")
    }

    setIsParentNoteDialogOpen(false)
    setSelectedStudent("")
    setParentNoteContent("")
  }

  const handleDetailedAnalysis = (studentId: string) => {
    router.push(`/teacher/guidance/analysis/${studentId}`)
  }

  // Statü hesapla
  const getStudentStatus = (student: GuidanceStudent) => {
    const {
      homeworkParticipation,
      examParticipation,
      attendanceRate,
    } = student
    const scores = [
      homeworkParticipation,
      examParticipation,
      attendanceRate,
    ]

    if (scores.every((score) => score >= 75)) {
      return {
        status: "stable",
        badge: (
          <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Stabil
          </Badge>
        ),
      }
    }

    const belowFiftyCount = scores.filter((score) => score < 50).length
    if (belowFiftyCount >= 2) {
      return {
        status: "attention",
        badge: (
          <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            Dikkat Gereken
          </Badge>
        ),
      }
    }

    return {
      status: "neutral",
      badge: null,
    }
  }

  const getPerformanceIcon = (score: number) => {
    if (score >= 75)
      return <TrendingUp className="h-4 w-4 text-green-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            Öğrenci verileri yükleniyor...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Rehber Öğretmen Modülü
          </h1>
          <p className="text-muted-foreground">
            Öğrenci gelişimini takip edin ve rehberlik notları ekleyin
          </p>
        </div>

        <div>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => setIsAddNoteDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Rehberlik Notu Ekle
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Toplam Öğrenci
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.total}
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
                  Dikkat Gereken
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.needsAttention}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Stabil Durum
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.stable}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4">
            <Label>Durum Filtresi:</Label>
            <Select
              value={filterStatus}
              onValueChange={(v: any) => {
                setFilterStatus(v)
                setPage(1) // PAGINATION RESET
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Öğrenciler</SelectItem>
                <SelectItem value="attention">Dikkat Gereken</SelectItem>
                <SelectItem value="stable">Stabil Durum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Label>Sınıf:</Label>
            <Select
              value={selectedClass}
              onValueChange={(v) => {
                setSelectedClass(v)
                setPage(1) // PAGINATION RESET
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tüm sınıflar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Tüm Sınıflar</SelectItem>
                {classOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student Development Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Öğrenci Gelişim Analizi
          </CardTitle>
          <CardDescription>
            Detaylı öğrenci değerlendirmeleri ve rehberlik notları
          </CardDescription>
        </CardHeader>

        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Filtrelere uygun öğrenci bulunamadı.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {paginatedStudents.map((student) => {
                  const latestNote = student.guidanceNotes[0]

                  return (
                    <div
                      key={student.id}
                      className={`p-6 border rounded-lg transition-colors ${
                        student.needsAttention
                          ? "border-red-200 bg-red-50 hover:bg-red-50"
                          : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3
  className="
    font-semibold 
    text-foreground
    whitespace-nowrap 
    overflow-hidden 
    text-ellipsis 
    min-w-0
    max-w-[60%]
    text-[clamp(0.85rem,4vw,1rem)]
    flex-shrink
  "
>
  {student.name}
</h3>

                            <Badge variant="outline">
                              {student.className}
                            </Badge>
                            {(() => {
                              const s = getStudentStatus(student)
                              return s.badge
                            })()}
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">
                            {student.notes}
                          </p>

                          {latestNote ? (
                            <>
                              <p className="text-xs text-muted-foreground">
                                Son rehberlik notu:{" "}
                                {formatDateTime(latestNote.date)}
                              </p>
                              <p
  className="
    text-xs 
    text-muted-foreground
    whitespace-nowrap 
    overflow-hidden 
    text-ellipsis 
    max-w-full
    text-[clamp(0.7rem,3vw,0.8rem)]
    flex-shrink
  "
>
  Notu yazan: {latestNote.createdBy || "Bilinmiyor"}
</p>

                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Son güncelleme:{" "}
                              {formatDateTime(student.lastUpdate)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 3 kolonluk barlar */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="p-4 bg-background rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Ödevlere Katılım Oranı
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Şu an geliştiriliyor
                          </p>
                        </div>

                        <div className="p-4 bg-background rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Sınavlara Katılım Oranı
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Şu an geliştiriliyor
                          </p>
                        </div>

                        <div className="p-4 bg-background rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              Devam Oranı
                            </span>
                            {getPerformanceIcon(student.attendanceRate)}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-green-500"
                                style={{
                                  width: `${student.attendanceRate}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm font-bold">
                              %{student.attendanceRate}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDetailedAnalysis(student.id)
                          }
                        >
                          Detaylı Analiz
                        </Button>

                       
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ⭐ PAGINATION BUTTONS */}
              {filteredStudents.length > PAGE_SIZE && (
                <div className="flex items-center justify-between mt-6">
                  <span className="text-xs text-muted-foreground">
                    {startIndex + 1}–
                    {Math.min(endIndex, filteredStudents.length)} /{" "}
                    {filteredStudents.length}
                  </span>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Önceki
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Sonraki
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Rehberlik Notu Ekle Dialog */}
      {isAddNoteDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-2">
              Rehberlik Notu Ekle
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Sınıf ve öğrenci seçin, gelişim alanı belirleyin ve
              değerlendirme notu ekleyin.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sınıf Seçin</Label>
                <Select
                  value={selectedClass}
                  onValueChange={(val) => {
                    setSelectedClass(val)
                    setSelectedStudent("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sınıf seçin" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {classOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Öğrenci Seçin</Label>
                <Select
                  value={selectedStudent}
                  onValueChange={setSelectedStudent}
                  disabled={!selectedClass}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        selectedClass
                          ? "Öğrenci seçin"
                          : "Önce sınıf seçin"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {selectedClass &&
                      studentsData
                        .filter(
                          (s) => String(s.classId) === selectedClass,
                        )
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Gelişim Alanı</Label>
                <Select
                  value={selectedArea}
                  onValueChange={setSelectedArea}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Gelişim alanı seçin" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {developmentAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Değerlendirme Notu</Label>
                <Textarea
                  rows={4}
                  placeholder="Öğrencinin bu alandaki durumu..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsAddNoteDialogOpen(false)}
              >
                İptal
              </Button>
              <Button
                onClick={handleAddNote}
                disabled={
                  !selectedStudent ||
                  !selectedArea ||
                  !noteContent
                }
              >
                Notu Kaydet
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Veliye Not Dialog */}
      {isParentNoteDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-2">
              Veliye Not Bırak
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Seçili öğrenci için veliye iletilecek notu yazın.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Not İçeriği</Label>
                <Textarea
                  rows={4}
                  placeholder="Veliye iletilecek not..."
                  value={parentNoteContent}
                  onChange={(e) =>
                    setParentNoteContent(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() =>
                  setIsParentNoteDialogOpen(false)
                }
              >
                İptal
              </Button>
              <Button
                onClick={handleParentNote}
                disabled={!parentNoteContent || !selectedStudent}
              >
                Notu Gönder
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
