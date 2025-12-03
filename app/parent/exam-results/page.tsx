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

/* ---------------- Helpers ---------------- */

// 🔥 Tarih kaymasını engelleyen fonksiyon
function safeDate(d: string) {
  if (!d) return new Date()
  return new Date(d + "T00:00:00") // UTC kaymasını önler
}

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

  /* ---------------- AUTH CHECK ---------------- */
  useEffect(() => {
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

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    if (!authChecked) return

    const fetchAll = async () => {
      try {
        setLoading(true)
        setError(null)

        const [studentsRes, examsRes] = await Promise.all([
          fetch("/api/parent/students", { credentials: "include" }),
          fetch("/api/vbs/parent/exams", {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }),
        ])

        if (!studentsRes.ok) {
          throw new Error("Öğrenci listesi alınamadı")
        }
        if (!examsRes.ok) {
          throw new Error("Sınav sonuçları alınamadı")
        }

        /* ---- Öğrenciler ---- */
        const studentsJson = await studentsRes.json()
        const studentItems = Array.isArray(studentsJson.items)
          ? studentsJson.items
          : []

        const students: ParentStudent[] = studentItems.map((s: any) => ({
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

        /* ---- Eğer tek öğrenci varsa otomatik seç ---- */
        if (selectedStudent === "all" && students.length === 1) {
          setSelectedStudent(students[0].id)
        }

        /* ---- Sınavlar ---- */
        const examsJson = await examsRes.json()

        const transformed: ExamResult[] = (examsJson.examResults || []).map(
          (exam: any) => ({
            id: `${exam.id}-${exam.studentId}`,
            studentId: String(exam.studentId),
            studentName: String(exam.studentName ?? "Öğrenci"),
            class: String(exam.className ?? "-"),
            subject: String(exam.subject ?? "Ders"),
            examTitle: String(exam.examTitle ?? "Sınav"),
            examDate: String(exam.examDate ?? new Date().toISOString()),
            teacher: String(exam.teacherName ?? "Öğretmen"),
            examPhoto: String(exam.fileUrl ?? ""),
            hasTeacherAnalysis: !!exam.feedback,
            teacherAnalysis: exam.feedback,
            topics: Array.isArray(exam.topics) ? exam.topics : [],
          }),
        )

        setExamResults(transformed)
      } catch (err: any) {
        setError(err?.message || "Yükleme hatası oluştu")
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [authChecked, router, selectedStudent])

  /* ---------------- FILTERS + SORT ---------------- */
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

  // 🔥 EN ÖNEMLİSİ: en yeni sınav en üstte
  const sortedResults = [...filteredResults].sort(
    (a, b) =>
      safeDate(b.examDate).getTime() -
      safeDate(a.examDate).getTime(),
  )

  /* ---------------- SUBJECT LIST ---------------- */
  const subjects = useMemo(() => {
    const all: string[] = []

    if (selectedStudent === "all") {
      parentStudents.forEach((st) =>
        st.subjects.forEach((s) => all.push(s.name)),
      )
    } else {
      const st = parentStudents.find((x) => x.id === selectedStudent)
      if (st) st.subjects.forEach((s) => all.push(s.name))
    }

    return [...new Set(all)]
  }, [parentStudents, selectedStudent])

  const studentOptions: StudentOption[] = useMemo(() => {
    return parentStudents.map((s) => ({
      id: s.id,
      name: s.name,
      class: s.className,
    }))
  }, [parentStudents])

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Sınav Sonuçları</h1>
        <p className="text-muted-foreground">Yükleniyor...</p>
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

      <div>
        <h1 className="text-2xl font-bold">Sınav Sonuçları</h1>
        <p className="text-muted-foreground">
          Öğretmenler tarafından yüklenen sınav sonuçlarını görüntüleyin
        </p>
      </div>

      {/* ----- List ----- */}
      <Card>
        <CardHeader>
          <CardTitle>Sınav Sonuçları</CardTitle>
          <CardDescription>En yeni sınavlar en üstte</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedResults.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Sınav sonucu bulunamadı.
            </p>
          ) : (
            <div className="space-y-4">
              {sortedResults.map((result) => (
                <div
                  key={result.id}
                  className="p-6 border rounded-lg space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{result.examTitle}</h3>
                    <Badge variant="outline">{result.subject}</Badge>
                  </div>

                  <div className="text-sm text-muted-foreground flex gap-4">
                    <span>{result.studentName}</span>
                    <span>
                      {safeDate(result.examDate).toLocaleDateString("tr-TR")}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedPhoto(result.examPhoto)
                    }
                  >
                    <Eye className="h-4 w-4 mr-1" /> Fotoğrafı Gör
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedPhoto}
        onOpenChange={() => setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedExamTitle}</DialogTitle>
          </DialogHeader>

          <div className="flex justify-center bg-gray-50 p-4 rounded-lg">
            {selectedPhoto && (
              <Image
                src={selectedPhoto}
                alt="Sınav Fotoğrafı"
                width={800}
                height={1000}
                className="rounded-lg shadow-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
