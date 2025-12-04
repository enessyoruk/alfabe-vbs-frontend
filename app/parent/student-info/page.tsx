"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Calendar, BookOpen } from "lucide-react"

type ApiSubject = {
  name?: string
  dersAdi?: string
  lessonName?: string
  courseName?: string
  teacher?: string
  teacherName?: string
  ogretmenAdi?: string
}

type UiSubject = {
  name: string
  teacher: string
}

type ApiStudentDetail = {
  id: string | number
  name?: string
  fullName?: string
  adSoyad?: string
  class?: string
  className?: string
  sinif?: string

  birthDate?: string
  dateOfBirth?: string
  dogumTarihi?: string

  enrollmentDate?: string
  registerDate?: string
  kayitTarihi?: string

  totalAbsences?: number
  totalAbsenceCount?: number
  toplamDevamsizlik?: number

  photoUrl?: string
  photo?: string
  imageUrl?: string
  avatarUrl?: string

  subjects?: ApiSubject[]
  courses?: ApiSubject[]
  lessons?: ApiSubject[]
}

type UiStudentDetail = {
  id: string
  name: string
  class: string
  birthDate?: string
  enrollmentDate?: string
  totalAbsences: number
  photo: string
  subjects: UiSubject[]
}

function normalizeSubjects(input: unknown): UiSubject[] {
  const arr: ApiSubject[] = Array.isArray(input) ? (input as ApiSubject[]) : []
  return arr.map((s) => ({
    name: String(
      s.name ?? s.dersAdi ?? s.lessonName ?? s.courseName ?? "Ders"
    ),
    teacher: String(
      s.teacher ??
        s.teacherName ??
        s.ogretmenAdi ??
        "Öğretmen"
    ),
  }))
}

function normalizeStudentDetail(x: ApiStudentDetail): UiStudentDetail {
  const name = String(x.name ?? x.fullName ?? x.adSoyad ?? "Öğrenci")
  const sinif = String(x.class ?? x.className ?? x.sinif ?? "-")

  const birthDate =
    x.birthDate ??
    x.dateOfBirth ??
    x.dogumTarihi

  const enrollmentDate =
    x.enrollmentDate ??
    x.registerDate ??
    x.kayitTarihi

  const totalAbsences =
    x.totalAbsences ??
    x.totalAbsenceCount ??
    x.toplamDevamsizlik ??
    0

  const photo =
    x.photoUrl ??
    x.photo ??
    x.imageUrl ??
    x.avatarUrl ??
    ""

  const subjectsSource =
    x.subjects ??
    x.courses ??
    x.lessons ??
    []

  return {
    id: String(x.id ?? ""),
    name,
    class: sinif,
    birthDate,
    enrollmentDate,
    totalAbsences,
    photo,
    subjects: normalizeSubjects(subjectsSource),
  }
}

export default function StudentInfoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [parentId, setParentId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const [students, setStudents] = useState<UiStudentDetail[]>([])
  const [student, setStudent] = useState<UiStudentDetail | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Oturum / parentId bilgisi
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
      // Login payload: { user: { id, email, name, roles } } veya düz { id, ... }
      const id =
        parsed?.user?.id ??
        parsed?.id

      if (!id) {
        setAuthChecked(true)
        router.replace("/login")
        return
      }

      setParentId(String(id))
      setAuthChecked(true)
    } catch {
      setAuthChecked(true)
      router.replace("/login")
    }
  }, [router])

  // Öğrenci bilgilerini yükle
  useEffect(() => {
    if (!authChecked) return
    if (!parentId) return

    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        params.set("parentId", parentId)

        const res = await fetch(`/api/parent/students?${params.toString()}`, {
          credentials: "include",
        })

        if (res.status === 401 || res.status === 403) {
          router.replace("/login")
          return
        }

        const json = await res.json().catch(() => ({} as any))

        if (!res.ok) {
          const msg =
            (json as any)?.error ||
            `Öğrenci listesi alınamadı (HTTP ${res.status}).`
          throw new Error(msg)
        }

        const arr: ApiStudentDetail[] = Array.isArray((json as any)?.items)
          ? (json as any).items
          : Array.isArray(json)
          ? (json as any)
          : []

        if (!arr.length) {
          if (!cancelled) {
            setStudents([])
            setStudent(null)
          }
          return
        }

        const normalizedList = arr.map(normalizeStudentDetail)

        // URL'den öğrenci seçimi: ?student=ID veya ?studentId=ID
        const fromQuery =
          searchParams.get("student") ||
          searchParams.get("studentId")

        let selected: UiStudentDetail | undefined

        if (fromQuery) {
          selected = normalizedList.find(
            (s) => String(s.id) === String(fromQuery)
          )
        }

        if (!selected) {
          selected = normalizedList[0]
        }

        if (!cancelled) {
          setStudents(normalizedList)
          setStudent(selected ?? null)
        }
      } catch (e: any) {
  if (!cancelled) {
    toast.error(e?.message || "Öğrenci bilgileri yüklenemedi.", {
      duration: 2500,
      position: "bottom-right",
    })

    setError(e?.message || "Öğrenci bilgileri yüklenemedi.")
    setStudents([])
    setStudent(null)
  }
} finally {
  if (!cancelled) {
    setLoading(false)
  }
}

    }

    load()

    return () => {
      cancelled = true
    }
  }, [authChecked, parentId, router, searchParams])

  const handleSelectStudent = (id: string) => {
    const found = students.find((s) => s.id === id)
    if (found) {
      setStudent(found)
    }
  }

  

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Öğrenci bilgilerini görüntüleyin
        </h1>

        {/* Birden fazla öğrenci varsa seçim butonları */}
        {!loading && students.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {students.map((s) => (
              <button
  key={s.id}
  type="button"
  onClick={() => handleSelectStudent(s.id)}
  className={`px-3 py-1 rounded-full border text-sm font-semibold transition ${
    student?.id === s.id
      ? "bg-sky-100 text-sky-700 border-sky-400"
      : "bg-muted text-muted-foreground border-border"
  }`}
>
  {s.name}
</button>

            ))}
          </div>
        )}
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Öğrenci bilgileri yükleniyor...
            </p>
          </CardContent>
        </Card>
      ) : !student ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Sisteme kayıtlı öğrenci bulunamadı.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student Profile */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage
                    src={student.photo || "/student-girl.png"}
                    alt={student.name}
                  />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">{student.name}</CardTitle>
                <CardDescription>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge variant="secondary">{student.class}</Badge>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
  {/* 1) Sınıf / Şube bilgisi */}
  <div className="flex items-center gap-3">
    <Calendar className="h-4 w-4 text-muted-foreground" />
    <div>
      <p className="text-sm font-medium">Sınıf / Şube</p>
      <p className="text-sm text-muted-foreground">
        {student.class || "Sınıf bilgisi yok"}
      </p>
    </div>
  </div>

  {/* 2) Devamsızlık özeti */}
  <div className="flex items-center gap-3">
    <BookOpen className="h-4 w-4 text-muted-foreground" />
    <div>
      <p className="text-sm font-medium">Devamsızlık Özeti</p>
      <p className="text-sm text-muted-foreground">
        {student.totalAbsences > 0
          ? `Bu dönem toplam ${student.totalAbsences} gün devamsızlık`
          : "Şu ana kadar devamsızlık görünmüyor"}
      </p>
    </div>
  </div>

  <Separator />

  {/* Alt kısım: sayısal özet aynı kalsın */}
  <div className="text-center">
    <p className="text-2xl font-bold text-orange-600">
      {student.totalAbsences}
    </p>
    <p className="text-xs text-muted-foreground">Toplam Devamsızlık</p>
  </div>
</CardContent>

            </Card>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Akademik Bilgiler
                </CardTitle>
                <CardDescription>
                  Ders durumu ve öğretmen bilgileri
                </CardDescription>
              </CardHeader>
              <CardContent>
                {student.subjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Bu öğrenci için ders/öğretmen bilgisi bulunamadı.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {student.subjects.map((subject, index) => (
                      <div
                        key={index}
                        className="p-4 border border-border rounded-lg"
                      >
                        <div className="mb-2">
                          <h4 className="font-medium text-[#0891B2]">
                            {subject.name}
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Öğretmen: {subject.teacher}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
