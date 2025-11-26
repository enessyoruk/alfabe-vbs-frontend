// app/parent/exam-results/page.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FileText,
  Search,
  Eye,
  Download,
  ImageIcon,
  MessageSquare,
  X,
  Tag,
} from "lucide-react"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"

type ExamResult = {
  id: string
  studentId: string
  studentName: string
  class: string
  subject: string
  examTitle: string
  examDate: string
  teacher: string
  examPhoto: string
  hasTeacherAnalysis: boolean
  teacherAnalysis?: string
  topics?: string[]
}

type StudentOption = {
  id: string
  name: string
  class: string
}

type ParentStudent = {
  id: string
  name: string
  className: string
  subjects: { name: string; teacherName?: string }[]
}


export default function ParentExamResultsPage() {
  const router = useRouter()

  const [selectedStudent, setSelectedStudent] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [selectedExamTitle, setSelectedExamTitle] = useState<string>("")
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [parentStudents, setParentStudents] = useState<ParentStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [authChecked, setAuthChecked] = useState(false)

  // Oturum kontrolü: vbs:user yoksa login'e at
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const raw = window.localStorage.getItem("vbs:user")
      if (!raw) {
        setAuthChecked(true)
        router.replace("/login")
        return
      }

      setAuthChecked(true)
    } catch {
      setAuthChecked(true)
      router.replace("/login")
    }
  }, [router])

  // Öğrenciler + sınav sonuçları aynı anda yüklenir
  useEffect(() => {
    if (!authChecked) return

    const fetchAll = async () => {
      try {
        setLoading(true)
        setError(null)

        const [studentsRes, examsRes] = await Promise.all([
          fetch("/api/parent/students", {
            credentials: "include",
          }),
          fetch("/api/vbs/parent/exams", {

            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }),
        ])

        // Yetki sorunu varsa login'e at
        if (
          studentsRes.status === 401 ||
          studentsRes.status === 403 ||
          examsRes.status === 401 ||
          examsRes.status === 403
        ) {
          router.replace("/login")
          return
        }

        if (!studentsRes.ok) {
          const t = await studentsRes.text().catch(() => "")
          throw new Error(
            t || `Öğrenci listesi alınamadı (HTTP ${studentsRes.status}).`,
          )
        }

        if (!examsRes.ok) {
          const t = await examsRes.text().catch(() => "")
          throw new Error(
            t || `Sınav sonuçları alınamadı (HTTP ${examsRes.status}).`,
          )
        }

        // ----- Öğrenciler -----
        const studentsJson = await studentsRes.json()
        const studentsItems = Array.isArray(studentsJson.items)
          ? studentsJson.items
          : []

        const students: ParentStudent[] = studentsItems.map((s: any) => ({
  id: String(s.id),
  name: String(s.fullName ?? s.name ?? "Öğrenci"),
  className: String(s.className ?? s.branch ?? "-"),
  subjects: Array.isArray(s.subjects)
    ? s.subjects.map((sub: any) => ({
        name: String(sub.name),
        teacherName: sub.teacherName ?? null,
      }))
    : [],
}))



        setParentStudents(students)

        // Eğer seçili öğrenci yoksa ve bir tane varsa default ona çek
        if (selectedStudent === "all" && students.length === 1) {
          setSelectedStudent(students[0].id)
        }

        // ----- Sınavlar -----
        const examsJson = await examsRes.json()

        const transformedData: ExamResult[] = (examsJson.examResults || []).map(
          (exam: any) => {
            const cleanClassName = String(exam.className ?? "")
              .replace(
                /\s*(Matematik|Fen|İngilizce|Türkçe|Tarih|Coğrafya|Fizik|Kimya|Biyoloji)\s*/gi,
                "",
              )
              .trim()

            return {
              // her öğrenci-sınav satırı için uniq key
              id: `${exam.id}-${exam.studentId}`,
              studentId: String(exam.studentId),
              studentName: String(exam.studentName ?? "Öğrenci"),
              class: cleanClassName || "-",
              subject: String(exam.subject ?? "Ders"),
              examTitle: String(exam.examTitle ?? "Sınav"),
              examDate: String(exam.examDate ?? new Date().toISOString()),
              teacher: String(exam.teacherName ?? exam.teacher ?? "Öğretmen"),
              examPhoto: String(exam.fileUrl ?? ""),
              hasTeacherAnalysis: !!exam.feedback,
              teacherAnalysis: exam.feedback,
              topics: Array.isArray(exam.topics) ? exam.topics : [],
            }
          },
        )

        setExamResults(transformedData)
      } catch (err: any) {
        console.error("[parent] Failed to fetch exams/students:", err)
        setError(
          err?.message ||
            "Sınav sonuçları yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        )
        setExamResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [authChecked, router, selectedStudent])

  const filteredResults = examResults.filter((result) => {
    const matchesStudent =
      selectedStudent === "all" || result.studentId === selectedStudent
    const matchesSubject =
      subjectFilter === "all" || result.subject === subjectFilter
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      result.examTitle.toLowerCase().includes(term) ||
      result.subject.toLowerCase().includes(term)

    return matchesStudent && matchesSubject && matchesSearch
  })

  const getExamStats = () => {
    const total = filteredResults.length
    const withAnalysis = filteredResults.filter((r) => r.hasTeacherAnalysis)
      .length
    const withoutAnalysis = total - withAnalysis

    return { total, withAnalysis, withoutAnalysis }
  }

  const stats = getExamStats()

  // 🎯 Ders listesini SEÇİLİ ÖĞRENCİYE göre çıkar
  // 🎯 Tüm çocukların derslerini toplayan yeni sistem
// 🎯 Ders listesi öğrencilerin backend'ten gönderdiği "subjects" listesinden oluşturulur
const subjects = useMemo(() => {
  const allSubjects: string[] = []

  if (selectedStudent === "all") {
    // Tüm öğrencilerin tüm dersleri
    parentStudents.forEach((st) => {
      if (Array.isArray(st.subjects)) {
        st.subjects.forEach((sub) => {
          if (sub.name) allSubjects.push(sub.name)
        })
      }
    })
  } else {
    // Tek öğrenci seçiliyse sadece o öğrencinin dersleri
    const st = parentStudents.find((x) => x.id === selectedStudent)
    if (st && Array.isArray(st.subjects)) {
      st.subjects.forEach((sub) => {
        if (sub.name) allSubjects.push(sub.name)
      })
    }
  }

  return [...new Set(allSubjects)]
}, [parentStudents, selectedStudent])



  // Öğrenci filtresi: öncelik backend student listesi, yoksa examResults fallback
  const studentOptions: StudentOption[] = useMemo(() => {
    if (parentStudents.length > 0) {
      return parentStudents.map((s) => ({
        id: s.id,
        name: s.name,
        class: s.className,
      }))
    }

    // fallback: sadece sınavı olan çocuklardan üret
    const map = new Map<string, StudentOption>()
    for (const r of examResults) {
      if (!map.has(r.studentId)) {
        map.set(r.studentId, {
          id: r.studentId,
          name: r.studentName,
          class: r.class,
        })
      }
    }
    return Array.from(map.values())
  }, [parentStudents, examResults])

  const handleViewPhoto = (photoUrl: string, examTitle: string) => {
    setSelectedPhoto(photoUrl)
    setSelectedExamTitle(examTitle)
  }

  const handleDownloadPhoto = async (photoUrl: string, examTitle: string) => {
  try {
    const response = await fetch(
      `/api/parent/exam-photo?url=${encodeURIComponent(photoUrl)}`,
      {
        credentials: "include",
      }
    )

    if (!response.ok) {
      throw new Error(`Fotoğraf indirilemedi (HTTP ${response.status})`)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = `${examTitle.replace(/\s+/g, "_")}_sinav_sonucu.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error("Fotoğraf indirme hatası:", error)
    alert("Fotoğraf indirilemedi. Lütfen tekrar deneyin.")
  }
}


  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sınav Sonuçları</h1>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sınav Sonuçları</h1>
        <p className="text-muted-foreground">
          Öğretmenler tarafından yüklenen sınav sonuçlarını görüntüleyin
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Toplam Sınav
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.total}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Öğretmen Analizi Olan
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.withAnalysis}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Sadece Fotoğraf Yüklenen
                </p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {stats.withoutAnalysis}
                </p>
              </div>
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Sınav ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Öğrenci filtresi */}
            <Select
              value={selectedStudent}
              onValueChange={(val) => {
                setSelectedStudent(val)
                // Öğrenci değişince ders filtresini resetlemek daha mantıklı
                setSubjectFilter("all")
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Öğrenci seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Çocuklar</SelectItem>
                {studentOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {/* Sadece ad-soyad */}
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ders filtresi */}
            <Select
              value={subjectFilter}
              onValueChange={setSubjectFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Dersler</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sınav Sonuçları Listesi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sınav Sonuçları
          </CardTitle>
          <CardDescription>
            Öğretmenler tarafından yüklenen sınav fotoğrafları ve isteğe bağlı
            analizler
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ||
                selectedStudent !== "all" ||
                subjectFilter !== "all"
                  ? "Filtrelere uygun sınav sonucu bulunamadı."
                  : "Henüz sınav sonucu bulunmuyor."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  className="p-6 border border-border rounded-lg transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {result.examTitle}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {result.subject}
                        </Badge>
                        {result.hasTeacherAnalysis && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Analiz Var
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="font-medium">
                          {result.studentName}
                        </span>
                        
                        
                        <span>
                          {new Date(result.examDate).toLocaleDateString(
                            "tr-TR",
                          )}
                        </span>
                      </div>

                      {/* Konu / kazanım etiketleri */}
                      {result.topics && result.topics.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="flex items-center text-xs text-muted-foreground gap-1">
                            <Tag className="h-3 w-3" />
                            Çalışılan konular:
                          </span>
                          {result.topics.map((t, idx) => (
                            <Badge
                              key={`${result.id}-topic-${idx}`}
                              variant="outline"
                              className="text-xs"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleViewPhoto(result.examPhoto, result.examTitle)
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Sınav Fotoğrafını Görüntüle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDownloadPhoto(
                          result.examPhoto,
                          result.examTitle,
                        )
                      }
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Fotoğrafı İndir
                    </Button>
                  </div>

                  {result.hasTeacherAnalysis && result.teacherAnalysis && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Öğretmen Analizi
                      </h4>
                      <p className="text-sm text-blue-700">
                        {result.teacherAnalysis}
                      </p>
                    </div>
                  )}

                  {!result.hasTeacherAnalysis && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Bu sınav için sadece fotoğraf yüklenmiş, öğretmen
                        analizi bulunmuyor.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fotoğraf Modalı */}
      <Dialog
        open={!!selectedPhoto}
        onOpenChange={() => setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedExamTitle} - Sınav Fotoğrafı</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center bg-gray-50 p-4 rounded-lg">
            {selectedPhoto && (
              <Image
                src={selectedPhoto || "/placeholder.svg"}
                alt={`${selectedExamTitle} sınav fotoğrafı`}
                width={800}
                height={1000}
                className="max-w-full h-auto rounded-lg shadow-lg"
                style={{ objectFit: "contain" }}
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/exam-result-document.jpg"
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
