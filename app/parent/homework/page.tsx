"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Clock, CheckCircle, Search, Info } from "lucide-react"
import { authService } from "@/lib/auth"

// ---- TIPLER ----

type HomeworkStatus = "pending" | "completed" | "overdue"

interface HomeworkSubmission {
  studentId: string
  studentName: string
  status: HomeworkStatus
  submittedDate: string | null
  grade?: string | null
  feedback?: string | null
}

interface HomeworkApiItem {
  id: string
  className: string
  title: string
  description: string
  subject: string
  assignedDate: string
  dueDate: string
  submissions: HomeworkSubmission[]
}

interface ParentHomeworkItem {
  id: string
  studentId: string
  studentName: string
  class: string
  title: string
  description: string
  subject: string
  teacher: string
  assignedDate: string
  dueDate: string
  status: HomeworkStatus
  submittedDate: string | null
  grade?: string | null
  feedback?: string | null
}

// Mock data for parent's children
const children = [
  { id: "1", name: "Elif Yılmaz", class: "9-A Matematik", photo: "/student-girl.png" },
  { id: "2", name: "Can Yılmaz", class: "7-B Fen", photo: "/student-boy.png" },
]

export default function ParentHomeworkPage() {
  const [selectedStudent, setSelectedStudent] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | HomeworkStatus>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [homeworkData, setHomeworkData] = useState<ParentHomeworkItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Ödev sistemi bilgilendirme pop-up'ı
  const [showInfoModal, setShowInfoModal] = useState<boolean>(true)

  useEffect(() => {
    const fetchHomework = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (!user) {
          
          setLoading(false)
          return
        }

        

        const response = await fetch("/api/homework", {
          method: "GET",
          credentials: "include", // cookie'leri gönder
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch homework: ${response.status}`)
        }

        const data = (await response.json()) as { homework: HomeworkApiItem[] }
        

        const transformedData: ParentHomeworkItem[] = data.homework.flatMap((hw) =>
          hw.submissions.map((sub) => {
            const cleanClassName = hw.className
              .replace(
                /\s*(Matematik|Fen|İngilizce|Türkçe|Tarih|Coğrafya|Fizik|Kimya|Biyoloji)\s*/gi,
                "",
              )
              .trim()

            return {
              id: `${hw.id}-${sub.studentId}`,
              studentId: sub.studentId,
              studentName: sub.studentName,
              class: cleanClassName,
              title: hw.title,
              description: hw.description,
              subject: hw.subject,
              teacher: "Öğretmen",
              assignedDate: hw.assignedDate,
              dueDate: hw.dueDate,
              status: sub.status,
              submittedDate: sub.submittedDate,
              grade: sub.grade ?? undefined,
              feedback: sub.feedback ?? undefined,
            }
          }),
        )

        setHomeworkData(transformedData)
      } catch (error) {
        console.error("[v0] Failed to fetch homework:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHomework()
  }, [])

  const filteredHomework: ParentHomeworkItem[] = homeworkData.filter((homework) => {
    const matchesStudent =
      selectedStudent === "all" || homework.studentId === selectedStudent
    const matchesStatus =
      statusFilter === "all" || homework.status === statusFilter
    const lowerSearch = searchTerm.toLowerCase()
    const matchesSearch =
      homework.title.toLowerCase().includes(lowerSearch) ||
      homework.subject.toLowerCase().includes(lowerSearch)

    return matchesStudent && matchesStatus && matchesSearch
  })

  const getDaysRemaining = (dueDate: string): number => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getHomeworkStats = () => {
    const total = filteredHomework.length
    const completed = filteredHomework.filter((hw) => hw.status === "completed").length
    const pending = filteredHomework.filter((hw) => hw.status === "pending").length
    const overdue = filteredHomework.filter((hw) => hw.status === "overdue").length
    return { total, completed, pending, overdue }
  }

  const stats = getHomeworkStats()

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ödevler</h1>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Ödev Sistemi Bilgilendirme Modalı */}
      {showInfoModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="mx-4 max-w-lg rounded-xl bg-background border shadow-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-1">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Ödev Sistemi Hazırlanıyor
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Değerli velimiz,
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Öğrencilerimizin ödev takip sürecini daha düzenli ve verimli
                  hale getirmek için dijital ödev sistemi üzerinde çalışıyoruz.
                  Şu anda öğretmenlerimiz ödevleri{" "}
                  <span className="font-medium">yüz yüze ve sınıf içinde</span>{" "}
                  vermeye devam etmektedir.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sistem tamamlandığında, veliler olarak ödevleri{" "}
                  <span className="font-medium">
                    anlık, düzenli ve takip edilebilir
                  </span>{" "}
                  şekilde buradan görüntüleyebileceksiniz.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  En doğru deneyimi sunmak için geliştirme sürecimiz devam
                  ediyor. İlginiz ve anlayışınız için teşekkür ederiz.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Tamam, anladım
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ödevler</h1>
        <p className="text-muted-foreground">Çocuklarınızın ödev durumlarını takip edin</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Ödev</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tamamlanan</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bekleyen</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Ödev ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Öğrenci seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Çocuklar</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(val: "all" | HomeworkStatus) => setStatusFilter(val)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="pending">Bekleyen</SelectItem>
                <SelectItem value="completed">Tamamlanan</SelectItem>
                <SelectItem value="overdue">Geciken</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Homework List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Ödev Listesi
          </CardTitle>
          <CardDescription>Çocuklarınızın ödev durumları ve detayları</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredHomework.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || selectedStudent !== "all" || statusFilter !== "all"
                  ? "Filtrelere uygun ödev bulunamadı."
                  : "Henüz ödev bulunmuyor."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHomework.map((homework) => {
                const daysRemaining = getDaysRemaining(homework.dueDate)

                return (
                  <div
                    key={homework.id}
                    className="p-6 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{homework.title}</h3>
                          {homework.status === "pending" && daysRemaining >= 0 && (
                            <Badge variant="outline" className="text-xs">
                              {daysRemaining === 0
                                ? "Bugün son gün"
                                : `${daysRemaining} gün kaldı`}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {homework.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-medium">{homework.studentName}</span>
                          <span>{homework.class}</span>
                          <span>{homework.subject}</span>
                          <span>Öğretmen: {homework.teacher}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Verilme Tarihi</p>
                        <p className="font-medium text-foreground">
                          {new Date(homework.assignedDate).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Teslim Tarihi</p>
                        <p className="font-medium text-foreground">
                          {new Date(homework.dueDate).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    </div>

                    {homework.status === "completed" &&
                      (homework.grade || homework.feedback) && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">Değerlendirme</h4>
                          {homework.grade && (
                            <p className="text-sm text-green-700 mb-1">
                              <span className="font-medium">Not:</span> {homework.grade}
                            </p>
                          )}
                          {homework.feedback && (
                            <p className="text-sm text-green-700">
                              <span className="font-medium">Geri Bildirim:</span>{" "}
                              {homework.feedback}
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
