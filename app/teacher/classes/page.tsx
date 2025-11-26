"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, ArrowRight } from "lucide-react"
import { http, endpoints } from "@/lib/api"

type ClassItem = {
  id: string
  name: string
  studentCount?: number
}

export default function TeacherClassesPage() {
  const router = useRouter()

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await http.get<any>(endpoints.teacher.classes, {
          signal: ctrl.signal,
        })

        const arr = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : []

        const mapped: ClassItem[] = arr.map((x: any) => ({
          id: String(x.id ?? x.classId),
          name: String(
            x.name ?? x.className ?? x.dersAdi ?? `Ders #${x.id ?? x.classId}`,
          ),
          studentCount: Number(x.studentCount ?? x.ogrenciSayisi ?? 0),
        }))

        setClasses(mapped)
      } catch (e: any) {
        if (e?.name === "AbortError") return
        console.error("[TeacherClassesPage] classes fetch error:", e)
        setError("Sınıf listesi alınamadı.")
      } finally {
        setLoading(false)
      }
    })()

    return () => ctrl.abort()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sınıflarım</h1>
          <p className="text-muted-foreground">
            Size atanmış sınıfları ve öğrenci sayılarını görüntülüyorsunuz.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && !error && classes.length === 0 && (
        <Alert>
          <AlertDescription>Size atanmış sınıf bulunamadı.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-9 w-24 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : (
          classes.map((c) => (
            <Card key={c.id} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{c.name}</span>
                  <Users className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {c.studentCount ?? 0} öğrenci
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/teacher/classes/${encodeURIComponent(
                        c.id,
                      )}?name=${encodeURIComponent(c.name)}`,
                    )
                  }
                  className="flex items-center gap-1"
                >
                  Öğrencileri Gör
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
