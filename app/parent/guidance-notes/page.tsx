// app/parent/guidance-notes/page.tsx
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  MessageCircle,
  Calendar,
  User,
  Search,
  NotebookTabs,
} from "lucide-react"

// ⭐ Modern dropdown için gerekli importlar
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"


type GuidanceNote = {
  id: string
  studentId: string
  studentName: string
  classId: string
  className: string
  area: string
  content: string
  createdAt: string
  createdBy?: string | null
}

type StudentOption = {
  id: string
  name: string
  className: string
}

function formatClassName(raw: string | null | undefined): string {
  if (!raw) return ""
  const trimmed = String(raw).trim()
  if (/sınıf/i.test(trimmed)) return trimmed
  if (/^\d+$/.test(trimmed)) return `${trimmed}. Sınıf`
  return trimmed
}

function formatDateTimeWithOffset(dateStr: string): string {
  const base = new Date(dateStr)
  const fixed = new Date(base.getTime() + 3 * 60 * 60 * 1000)
  return fixed.toLocaleString("tr-TR")
}

export default function ParentGuidanceNotesPage() {
  const router = useRouter()

  const [authChecked, setAuthChecked] = useState(false)
  const [notes, setNotes] = useState<GuidanceNote[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedStudent, setSelectedStudent] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")

  // ---------------- AUTH ----------------
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const raw = window.localStorage.getItem("vbs:user")
      if (!raw) {
        setAuthChecked(true)
        router.replace("/login")
        return
      }

      const parsed = JSON.parse(raw)
      const userType =
        parsed?.userType ??
        parsed?.user?.userType ??
        parsed?.role ??
        parsed?.user?.role

      if (userType && String(userType).toLowerCase() !== "parent") {
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

  // ---------------- FETCH ----------------
  useEffect(() => {
    if (!authChecked) return

    const fetchAll = async () => {
      try {
        setLoading(true)
        setError(null)

        const [notesRes, studentsRes] = await Promise.all([
          fetch("/api/parent/guidance-notes", {
            method: "GET",
            credentials: "include",
          }),
          fetch("/api/parent/students", {
            method: "GET",
            credentials: "include",
          }),
        ])

        if ([401, 403].includes(notesRes.status)) {
  toast.error("Oturum süreniz sona ermiş. Lütfen tekrar giriş yapın.", {
    duration: 2200,
    position: "bottom-right",
  })
  router.replace("/login")
  return
}

if ([401, 403].includes(studentsRes.status)) {
  toast.error("Oturum süreniz sona ermiş. Lütfen tekrar giriş yapın.", {
    duration: 2200,
    position: "bottom-right",
  })
  router.replace("/login")
  return
}


        const notesJson = await notesRes.json().catch(() => ({}))
        const items = Array.isArray(notesJson.items) ? notesJson.items : []

        setNotes(
          items.map((n: any) => ({
            id: String(n.id),
            studentId: String(n.studentId),
            studentName: String(n.studentName ?? "Öğrenci"),
            classId: String(n.classId ?? ""),
            className: String(n.className ?? ""),
            area: String(n.area ?? "Genel"),
            content: String(n.content ?? ""),
            createdAt: String(n.createdAt ?? new Date().toISOString()),
            createdBy: n.createdBy ?? null,
          }))
        )

        const studentsJson = await studentsRes.json().catch(() => ({}))
        const sItems = Array.isArray(studentsJson.items)
          ? studentsJson.items
          : []

        setStudents(
          sItems.map((s: any) => ({
            id: String(s.id ?? s.studentId ?? ""),
            name: String(s.name ?? s.fullName ?? "Öğrenci"),
            className: String(s.className ?? s.branch ?? ""),
          }))
        )
      } catch (err: any) {
  console.error("[parent] guidance fetch error", err)

  toast.error(err?.message || "Veriler yüklenirken bir hata oluştu.", {
    duration: 2500,
    position: "bottom-right",
  })

  setError(err?.message || "Veri alınamadı.")
  setNotes([])
} finally {
  setLoading(false)
}

    }

    fetchAll()
  }, [authChecked, router])

  // ---------------- OPTIONS ----------------
  const studentOptions: StudentOption[] = useMemo(() => {
    if (students.length > 0) return students

    const map = new Map<string, StudentOption>()
    for (const n of notes) {
      if (!map.has(n.studentId)) {
        map.set(n.studentId, {
          id: n.studentId,
          name: n.studentName,
          className: n.className,
        })
      }
    }
    return Array.from(map.values())
  }, [students, notes])

  const filteredNotes = useMemo(() => {
    const term = searchTerm.toLowerCase()

    return notes.filter((n) => {
      const matchesStudent =
        selectedStudent === "all" || n.studentId === selectedStudent

      const matchesSearch =
        !term ||
        n.content.toLowerCase().includes(term) ||
        n.area.toLowerCase().includes(term)

      return matchesStudent && matchesSearch
    })
  }, [notes, selectedStudent, searchTerm])

  const totalNotes = notes.length
  const totalStudents = studentOptions.length
  const totalAreas = new Set(notes.map((n) => n.area)).size

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Rehberlik Notları</h1>
        <p>Yükleniyor...</p>
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

      {/* ===== HEADER ===== */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rehberlik Notları</h1>
        <p className="text-muted-foreground">
          Öğretmenlerinizin paylaştığı rehberlik notları burada görünür.
        </p>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Not</p>
                <p className="text-2xl font-bold">{totalNotes}</p>
              </div>
              <NotebookTabs className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Öğrenci</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Farklı Alan</p>
                <p className="text-2xl font-bold">{totalAreas}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== FILTERS (Modern Select) ===== */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Not içinde ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* ⭐ MODERN SELECT - Tüm Çocuklar */}
            <div className="w-full md:w-56">
              <Select
                value={selectedStudent}
                onValueChange={(v: string) => setSelectedStudent(v)}
              >
                <SelectTrigger className="w-full rounded-md">
                  <SelectValue placeholder="Tüm Çocuklar" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg">
                  <SelectItem value="all">Tüm Çocuklar</SelectItem>
                  {studentOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== LIST ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Rehberlik Notları
          </CardTitle>
          <CardDescription>
            Öğretmenler tarafından paylaşılan rehberlik notları.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Henüz rehberlik notu bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((n) => (
  <div key={n.id} className="p-4 border rounded-lg space-y-3">
    
    {/* ÜST KISIM - Öğrenci Adı + Alan */}
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center flex-wrap gap-2">
        <Badge variant="outline" className="text-xs max-w-[150px] truncate">
          {n.studentName}
        </Badge>

        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs max-w-[130px] truncate">
          {n.area}
        </Badge>
      </div>
    </div>

    {/* TARİH ve NOTU YAZAN */}
    <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-1">
      <div className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        <span>
          {formatDateTimeWithOffset(n.createdAt).replace(" ", " - ")}
        </span>
      </div>

      {n.createdBy && (
        <span className="text-xs truncate">
          Notu yazan: {n.createdBy}
        </span>
      )}
    </div>

    {/* AYIRICI ÇİZGİ */}
    <div className="border-t my-2"></div>

    {/* NOT İÇERİĞİ */}
    <p className="text-sm whitespace-pre-wrap leading-relaxed">
      {n.content}
    </p>
  </div>
))}

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
