"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import { http, endpoints } from "@/lib/api"

type ApiStudent = {
  id: string | number
  firstName?: string
  lastName?: string
  fullName?: string
  grade?: string | number | null
  isActive?: boolean
}

type StudentItem = {
  id: string
  fullName: string
  grade?: string
  isActive: boolean
}

function normalizeStudent(s: ApiStudent): StudentItem {
  const id = String(s.id ?? "")
  const fullName =
    (s.fullName ||
      [s.firstName, s.lastName].filter(Boolean).join(" ") ||
      `Öğrenci #${id}`) as string

  return {
    id,
    fullName,
    grade: s.grade != null ? String(s.grade) : undefined,
    isActive: Boolean(s.isActive),
  }
}

export default function TeacherClassStudentsPage() {
  const router = useRouter()
  const params = useParams<{ id?: string }>()
  const searchParams = useSearchParams()

  const routeClassId = params?.id
  const queryClassId =
    searchParams?.get("classId") || searchParams?.get("id") || ""
  const classId = routeClassId ?? queryClassId

  const classNameFromQuery = searchParams?.get("name") || ""

  const [students, setStudents] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!classId) {
      setLoading(false)
      return
    }

    const ctrl = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await http.get<any>(
          endpoints.teacher.classStudents(classId),
          { signal: ctrl.signal },
        )

        const list: ApiStudent[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
          ? res.items
          : []

        setStudents(list.map(normalizeStudent))
      } catch (e: any) {
        const name = e?.name || ""
        const msg: string = String(e?.message || "")
        const lower = msg.toLowerCase()

        const isAbort =
          name === "AbortError" ||
          lower.includes("aborted") ||
          lower.includes("signal is aborted")

        if (isAbort) {
          console.warn("[TeacherClassStudentsPage] fetch aborted:", e)
          return
        }

        console.error("[TeacherClassStudentsPage] fetch error:", e)
        setError("Öğrenciler yüklenemedi.")
      } finally {
        setLoading(false)
      }
    })()

    return () => ctrl.abort()
  }, [classId])

  const hasStudents = useMemo(() => students.length > 0, [students])

 const title = classNameFromQuery
  ? classNameFromQuery
  : "Sınıf Öğrencileri"


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Geri
          </Button>
          <div>
            <h1
  className="
    font-bold 
    text-foreground
    whitespace-nowrap 
    overflow-hidden 
    text-ellipsis 
    max-w-full
    text-[clamp(1.1rem,4vw,1.75rem)]
    leading-tight
  "
>
  {title}
</h1>

            <p className="text-xs text-muted-foreground">
  Bu sınıfa kayıtlı öğrencileri görüntülüyorsunuz.
</p>

          </div>
        </div>
      </div>

      {/* Hata */}
      {!loading && error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* classId yoksa bilgi */}
      {!loading && !classId && (
        <Alert>
          <AlertDescription>
            Herhangi bir sınıf seçilmedi. Lütfen sınıf listesinden bir sınıf
            seçerek öğrencileri görüntüleyin.
          </AlertDescription>
        </Alert>
      )}

      {/* Boş durum */}
      {!loading && !error && classId && !hasStudents && (
        <Alert>
          <AlertDescription>
            Bu sınıfa henüz öğrenci atanmadı veya kayıt bulunamadı.
          </AlertDescription>
        </Alert>
      )}

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle>Öğrenci Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : hasStudents ? (
            <div className="space-y-2">
              {students.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{s.fullName}</p>
                    {s.grade && (
                      <p className="text-xs text-muted-foreground">
                        Sınıf: {s.grade}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={s.isActive ? "default" : "outline"}
                    className={
                      s.isActive
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "text-muted-foreground"
                    }
                  >
                    {s.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
