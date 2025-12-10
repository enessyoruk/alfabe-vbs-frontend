"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react"

/* ============================================================
   TYPES + HELPERS (AYNEN KALDI)
============================================================ */

type ApiStudent = {
  id: string | number
  name?: string
  fullName?: string
  class?: string
  className?: string
}

type UiStudent = {
  id: string
  name: string
  class: string
  subjects: string[]
}

type ApiAttendanceRecord = {
  id: string | number
  date?: string
  tarih?: string
  course?: string
  status?: string
  durum?: string
  teacher?: string
  notes?: string
}

type UiAttendanceRecord = {
  id: string
  date: string
  course: string
  status: "present" | "absent" | "late" | "unknown"
  teacher: string
  notes?: string
}

function normalizeStudent(x: ApiStudent): UiStudent {
  return {
    id: String(x.id ?? ""),
    name: String(x.name ?? x.fullName ?? "Öğrenci"),
    class: String(x.class ?? x.className ?? "-"),
    subjects: Array.isArray((x as any).subjects)
      ? (x as any).subjects.map((s: any) => s.name || s)
      : [],
  }
}

function normalizeAttendance(x: ApiAttendanceRecord): UiAttendanceRecord {
  const rawDate =
    x.date ??
    x.tarih ??
    new Date().toISOString()

  const rawStatus =
    x.status ??
    x.durum ??
    ""

  const statusText = rawStatus.toLowerCase().trim()

  let status: UiAttendanceRecord["status"] = "unknown"
  if (["present", "var", "devam"].includes(statusText)) status = "present"
  else if (["absent", "yok", "gelmedi"].includes(statusText)) status = "absent"
  else if (["late", "geç", "gec", "mazeretli"].includes(statusText)) status = "late"

  return {
    id: String(x.id ?? ""),
    date: rawDate,
    course: x.course || "Genel Yoklama",
    status,
    teacher: x.teacher || "Alfa-β Akademi",
    notes: x.notes || undefined,
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "present":
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case "absent":
      return <XCircle className="h-5 w-5 text-red-600" />
    case "late":
      return <Clock className="h-5 w-5 text-orange-600" />
    default:
      return <Clock className="h-5 w-5 text-gray-400" />
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "present":
      return <Badge className="bg-green-100 text-green-800">Katıldı</Badge>
    case "absent":
      return <Badge className="bg-red-100 text-red-800">Katılmadı</Badge>
    case "late":
      return <Badge className="bg-orange-100 text-orange-800">Mazeretli</Badge>
    default:
      return <Badge variant="secondary">Bilinmiyor</Badge>
  }
}

function formatMonthLabel(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return value
  const [y, m] = value.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
  })
}

/* ============================================================
   PAGE COMPONENT
============================================================ */

export default function AttendancePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [students, setStudents] = useState<UiStudent[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>("")

  const [attendance, setAttendance] = useState<UiAttendanceRecord[]>([])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })

  const [loadingStudents, setLoadingStudents] = useState(true)
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const pageSize = 10

  const monthOptions = useMemo(() => {
    const out: string[] = []
    const now = new Date()
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
    }
    return out
  }, [])

  /* ---------------- LOAD STUDENTS ---------------- */
  useEffect(() => {
    const ac = new AbortController()

    ;(async () => {
      try {
        setLoadingStudents(true)
        setError(null)

        const res = await fetch("/api/parent/students", {
          credentials: "include",
          signal: ac.signal,
        })

        if (res.status === 401) {
          router.replace("/login")
          return
        }

        const json = await res.json().catch(() => ({}))
        const arr: ApiStudent[] = Array.isArray(json.items) ? json.items : []

        const ui = arr.map(normalizeStudent)
        setStudents(ui)

        const fromQuery = searchParams.get("student")
        const initial =
          (fromQuery && ui.find((s) => s.id === fromQuery)?.id) ||
          ui[0]?.id ||
          ""

        setSelectedStudent(initial)
      } catch {
        setError("Öğrenciler alınamadı.")
      } finally {
        setLoadingStudents(false)
      }
    })()

    return () => ac.abort()
  }, [router, searchParams])

  /* ---------------- LOAD ATTENDANCE ---------------- */
  useEffect(() => {
    if (!selectedStudent) return

    const ac = new AbortController()

    ;(async () => {
      try {
        setLoadingAttendance(true)
        setError(null)

        const params = new URLSearchParams()
        params.set("studentId", selectedStudent)
        params.set("month", selectedMonth)

        const res = await fetch(`/api/attendance?${params.toString()}`, {
          credentials: "include",
          signal: ac.signal,
        })

        if (res.status === 401) {
          router.replace("/login")
          return
        }

        const json = await res.json().catch(() => ({}))
        const arr: ApiAttendanceRecord[] = Array.isArray(json.items)
          ? json.items
          : []

        setAttendance(arr.map(normalizeAttendance))
      } catch {
        setError("Devamsızlık verileri alınamadı.")
      } finally {
        setLoadingAttendance(false)
      }
    })()

    return () => ac.abort()
  }, [selectedStudent, selectedMonth, router])

  useEffect(() => {
    setPage(1)
  }, [selectedStudent, selectedMonth])

  /* ---------------- DERIVED ---------------- */

  const filtered = attendance

  const stats = useMemo(() => {
    const present = filtered.filter((r) => r.status === "present").length
    const absent = filtered.filter((r) => r.status === "absent").length
    const late = filtered.filter((r) => r.status === "late").length

    const valid = present + absent
    const rate = valid > 0 ? Math.round((present / valid) * 100) : 0

    return { present, absent, late, attendanceRate: rate }
  }, [filtered])

  const selectedStudentObj = students.find((s) => s.id === selectedStudent)
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const startIndex = (currentPage - 1) * pageSize
  const pagedRecords = filtered.slice(startIndex, startIndex + pageSize)

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="space-y-6">

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* HEADER BLOĞU */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Devamsızlık Takibi</h1>
          <p className="text-muted-foreground">Öğrenci devamsızlık kayıtlarını aylık olarak görüntüleyin.</p>
        </div>

        {/* 🔥 DROPDOWNLAR YAN YANA */}
        <div className="flex flex-row gap-2 w-full sm:w-auto">
          <Select
            value={selectedStudent}
            onValueChange={setSelectedStudent}
            disabled={loadingStudents}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Öğrenci seçin" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} {s.class && s.class.toLowerCase() !== "test" && `— ${s.class}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m} value={m}>
                  {formatMonthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ÖĞRENCİ YOK */}
      {students.length === 0 && !loadingStudents ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Sisteme kayıtlı öğrenci bulunamadı.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* STATS (DOKUNMADIM — SEN BEĞENDİN) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Devam Oranı</CardTitle>
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.attendanceRate}
                  <span className="text-base font-normal text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatMonthLabel(selectedMonth)} için genel katılım oranı
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Toplam Ders</CardTitle>
                <Calendar className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedStudentObj?.subjects?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">Öğrencinin aldığı toplam ders sayısı</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Katıldığı Ders</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.present}</div>
                <p className="text-xs text-muted-foreground">Yoklamaya katıldığı ders sayısı</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Katılmadı / Mazeretli</CardTitle>
                <XCircle className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  <span className="text-2xl">{stats.absent}</span>
                  <span className="text-xs text-muted-foreground ml-1">yok</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="text-2xl">{stats.late}</span>
                  <span className="text-xs text-muted-foreground ml-1">mazeretli</span>
                </div>
                <p className="text-xs text-muted-foreground">Devamsızlık ve mazeretli olarak işaretlenen dersler</p>
              </CardContent>
            </Card>
          </div>

          {/* DEVAMSIZLIK DETAYLARI */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Devamsızlık Kayıtları
              </CardTitle>

              {/* 🔥 ÖĞRENCİ ADI — küçültme + alt satır */}
              <p className="text-[clamp(0.9rem,3.6vw,1.1rem)] font-normal text-muted-foreground mt-1 leading-tight">
                {selectedStudentObj?.name || ""}
              </p>

              <CardDescription>{formatMonthLabel(selectedMonth)}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">

              {loadingAttendance ? (
                <p className="text-center text-muted-foreground py-8">Devamsızlık kayıtları yükleniyor...</p>
              ) : pagedRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Henüz yoklama kaydı alınmadı.</p>
              ) : (
                <>
                  {/* 🔥 YENİ MOBİL DÜZEN: ICON+INFO BLOK DİKEY, BADGE ALTA GEÇER */}
                  <div className="space-y-4">
                    {pagedRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg bg-muted/40"
                      >
                        <div className="flex items-start gap-4">
                          {getStatusIcon(rec.status)}

                          <div>
                            <p className="font-medium">{rec.course}</p>

                            {/* 🔥 TARİH */}
                            <p className="text-sm text-muted-foreground">
                              {new Date(rec.date).toLocaleDateString("tr-TR")}
                            </p>

                            {/* 🔥 ALFA-Β AKADEMİ → ALTTA YEŞİL */}
                            <p className="text-sm mt-1 font-medium" style={{ color: "#089B12" }}>
                              {rec.teacher}
                            </p>

                            {rec.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Not: {rec.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* BADGE ALTTA — MOBİLDE MÜKEMMEL DURUR */}
                        <div className="sm:self-center">{getStatusBadge(rec.status)}</div>
                      </div>
                    ))}
                  </div>

                  {/* PAGINATION */}
                  {pageCount > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t mt-4">
                      <p className="text-xs text-muted-foreground">
                        Sayfa {currentPage} / {pageCount} · Toplam {filtered.length} kayıt
                      </p>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                          Önceki
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage >= pageCount}
                          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
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
        </>
      )}
    </div>
  )
}
