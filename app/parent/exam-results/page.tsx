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

/* -------------------------------------------------- */
/*  SAFE DATE → Invalid Date %100 ENGELLENİR          */
/* -------------------------------------------------- */
function safeDate(input: string | null | undefined): Date {
  if (!input || typeof input !== "string") return new Date()

  const fix = input.includes("T") ? input : `${input}T00:00:00`
  const d = new Date(fix)
  return isNaN(d.getTime()) ? new Date() : d
}

/* -------------------------------------------------- */
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

type ParentStudent = {
  id: string
  name: string
  className: string
  subjects: { name: string; teacherName?: string }[]
}

/* -------------------------------------------------- */

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

  /* ---------- AUTH CHECK ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("vbs:user")
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

  /* ---------- FETCH DATA ---------- */
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

        if (!studentsRes.ok) throw new Error("Öğrenci listesi alınamadı.")
        if (!examsRes.ok) throw new Error("Sınav sonuçları alınamadı.")

        const sJson = await studentsRes.json()
        const sItems = Array.isArray(sJson.items) ? sJson.items : []

        const students: ParentStudent[] = sItems.map((s: any) => ({
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

        if (selectedStudent === "all" && students.length === 1) {
          setSelectedStudent(students[0].id)
        }

        /* ---------- EXAMS ---------- */
        const eJson = await examsRes.json()

        const transformed: ExamResult[] = (eJson.examResults || []).map(
          (exam: any) => ({
            id: `${exam.id}-${exam.studentId}`,
            studentId: String(exam.studentId),
            studentName: String(exam.studentName ?? "Öğrenci"),
            class: String(exam.className ?? "-"),
            subject: String(exam.subject ?? "Ders"),
            examTitle: String(exam.examTitle ?? "Sınav"),
            examDate: String(exam.examDate ?? ""), // safeDate() düzeltir
            teacher: String(exam.teacherName ?? exam.teacher ?? "Öğretmen"),
            examPhoto: String(exam.fileUrl ?? ""),
            hasTeacherAnalysis: !!exam.feedback,
            teacherAnalysis: exam.feedback,
            topics: Array.isArray(exam.topics) ? exam.topics : [],
          }),
        )

        setExamResults(transformed)
      } catch (err: any) {
        setError(err?.message || "Veriler yüklenirken hata oluştu.")
        setExamResults([])
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [authChecked, router, selectedStudent])

  /* ---------- FILTER + SEARCH ---------- */
  const filteredResults = examResults.filter((result) => {
    const matchesStudent =
      selectedStudent === "all" || result.studentId === selectedStudent

    const matchesSubject =
      subjectFilter === "all" || result.subject === subjectFilter

    const t = searchTerm.toLowerCase()
    const matchesSearch =
      result.examTitle.toLowerCase().includes(t) ||
      result.subject.toLowerCase().includes(t)

    return matchesStudent && matchesSubject && matchesSearch
  })

  /* ---------- SORT NEW → OLD ---------- */
  const sortedResults = [...filteredResults].sort(
    (a, b) => safeDate(b.examDate).getTime() - safeDate(a.examDate).getTime(),
  )

  /* ---------- SUBJECT LIST ---------- */
  const subjects = useMemo(() => {
    const out: string[] = []

    if (selectedStudent === "all") {
      parentStudents.forEach((st) =>
        st.subjects.forEach((x) => out.push(x.name)),
      )
    } else {
      const st = parentStudents.find((x) => x.id === selectedStudent)
      if (st) st.subjects.forEach((x) => out.push(x.name))
    }

    return [...new Set(out)]
  }, [parentStudents, selectedStudent])

  const studentOptions = parentStudents.map((s) => ({
    id: s.id,
    name: s.name,
    class: s.className,
  }))

  /* ---------- VIEW & DOWNLOAD ---------- */
  const handleViewPhoto = (photoUrl: string, examTitle: string) => {
    setSelectedPhoto(photoUrl)
    setSelectedExamTitle(examTitle)
  }

  const handleDownloadPhoto = async (photoUrl: string, examTitle: string) => {
    try {
      const response = await fetch(
        `/api/parent/exam-photo?url=${encodeURIComponent(photoUrl)}`,
        { credentials: "include" },
      )

      if (!response.ok)
        throw new Error(`Fotoğraf indirilemedi (${response.status})`)

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `${examTitle.replace(/\s+/g, "_")}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      alert("Fotoğraf indirilemedi. Tekrar deneyin.")
    }
  }

  /* ---------- LOADING UI ---------- */
  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Sınav Sonuçları</h1>
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    )
  }

  /* ---------- MAIN UI ---------- */
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Sınav Sonuçları</h1>
        <p className="text-muted-foreground">
          Öğretmenler tarafından yüklenen sonuçlar
        </p>
      </div>

      {/* LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Sınav Sonuçları</CardTitle>
          <CardDescription>En yeni sınav en üstte gösterilir</CardDescription>
        </CardHeader>

        <CardContent>
          {sortedResults.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Sınav sonucu bulunamadı.
            </p>
          ) : (
            <div className="space-y-5">
              {sortedResults.map((r) => (
                <div
                  key={r.id}
                  className="p-5 border rounded-lg bg-muted/30 hover:bg-muted/50 transition"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{r.examTitle}</h3>
                    <Badge variant="outline">{r.subject}</Badge>
                  </div>

                  <div className="text-sm text-muted-foreground flex gap-4 mb-3">
                    <span>{r.studentName}</span>
                    <span>{safeDate(r.examDate).toLocaleDateString("tr-TR")}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewPhoto(r.examPhoto, r.examTitle)}
                  >
                    <Eye className="h-4 w-4 mr-1" /> Fotoğrafı Gör
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL */}
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
                width={900}
                height={1100}
                className="rounded-lg shadow-lg"
                onError={(e) => {
                  const t = e.target as HTMLImageElement
                  t.src = "/exam-result-document.jpg"
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
