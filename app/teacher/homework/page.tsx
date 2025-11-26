"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  BookOpen,
  Plus,
  Calendar,
  Clock,
  Trash2,
  Edit,
  Users,
  Info,
  X,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { http, endpoints } from "@/lib/api"

type ClassItem = {
  id: string
  name: string
  subject?: string
  studentCount?: number
}

type HomeworkItem = {
  id: number
  classId: number
  className?: string
  title: string
  description?: string | null
  assignedDate?: string
  dueDate: string
  status?: "active" | "expired"
  submissions?: Array<any>
  totalStudents?: number
}

export default function HomeworkManagementPage() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [classesError, setClassesError] = useState<string | null>(null)

  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  // create dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState("")
  const [homeworkTitle, setHomeworkTitle] = useState("")
  const [homeworkDescription, setHomeworkDescription] = useState("")
  const [dueDate, setDueDate] = useState("")

  // archive & edit
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingHomework, setEditingHomework] = useState<HomeworkItem | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDueDate, setEditDueDate] = useState("")

  // Bilgilendirme kutusu (sağ üst, çarpılı)
  const [showInfo, setShowInfo] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    const dismissed = window.localStorage.getItem("vbs:teacherHomeworkInfoDismissed")
    if (dismissed === "1") return
    setShowInfo(true)
  }, [])

  function handleDismissInfo() {
    setShowInfo(false)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("vbs:teacherHomeworkInfoDismissed", "1")
    }
  }

  // ==== Load classes from backend (real) ====
  useEffect(() => {
    const ctrl = new AbortController()
    ;(async () => {
      try {
        setClassesLoading(true)
        setClassesError(null)
        const res = await http.get<any>(endpoints.teacher.classes, { signal: ctrl.signal })
        const arr = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : []
        const mapped: ClassItem[] = arr.map((x: any) => ({
          id: String(x.id),
          name: String(x.name ?? x.className ?? `Ders #${x.id}`),
          subject: x.subject ?? undefined,
          studentCount:
            typeof x.studentCount === "number"
              ? x.studentCount
              : undefined,
        }))
        setClasses(mapped)
      } catch (e: any) {
        setClassesError(e?.message || "Sınıf listesi alınamadı.")
      } finally {
        setClassesLoading(false)
      }
    })()
    return () => ctrl.abort()
  }, [])

  // ==== List homework via local proxy ====
  async function refreshHomework() {
    try {
      setListLoading(true)
      setListError(null)
      const res = await fetch("/api/teacher/homework", { credentials: "include" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list: HomeworkItem[] = Array.isArray(data?.items) ? data.items : []
      setHomeworkList(list)
    } catch (e: any) {
      setListError(e?.message || "Ödev listesi alınamadı.")
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    refreshHomework()
  }, [])

  // ==== Create ====
  async function handleCreateHomework() {
    try {
      const payload = {
        classId: Number(selectedClass),
        title: homeworkTitle.trim(),
        description: homeworkDescription.trim() || null,
        // date input yyyy-mm-dd → iso
        dueDate: new Date(dueDate + "T00:00:00").toISOString(),
        teacherId: undefined as number | undefined, // ileride claim’den doldurulabilir
      }
      const res = await fetch("/api/teacher/homework", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || `HTTP ${res.status}`)
      }
      await refreshHomework()
      setIsCreateDialogOpen(false)
      setSelectedClass("")
      setHomeworkTitle("")
      setHomeworkDescription("")
      setDueDate("")
    } catch (e) {
      console.error("Create homework error:", e)
      alert("Ödev oluşturulamadı.")
    }
  }

  // ==== Archive cleanup (older/expired) ====
  async function handleArchiveCleanup() {
    try {
      const res = await fetch("/api/teacher/homework?action=cleanup", {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await refreshHomework()
      setIsArchiveDialogOpen(false)
    } catch (e) {
      console.error("Archive cleanup error:", e)
      alert("Arşiv temizlenemedi.")
    }
  }

  // ==== Edit / Update ====
  function handleEditHomework(h: HomeworkItem) {
    setEditingHomework(h)
    setEditTitle(h.title)
    setEditDescription(h.description ?? "")
    setEditDueDate(h.dueDate?.slice(0, 10) || "")
    setIsEditDialogOpen(true)
  }

  async function handleUpdateHomework() {
    if (!editingHomework) return
    try {
      const res = await fetch("/api/teacher/homework", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingHomework.id,
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          dueDate: new Date(editDueDate + "T00:00:00").toISOString(),
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await refreshHomework()
      setIsEditDialogOpen(false)
      setEditingHomework(null)
    } catch (e) {
      console.error("Update homework error:", e)
      alert("Ödev güncellenemedi.")
    }
  }

  // ==== Delete ====
  async function handleDeleteHomework(id: number) {
    if (!confirm("Bu ödevi silmek istediğinizden emin misiniz?")) return
    try {
      const res = await fetch(
        `/api/teacher/homework?id=${encodeURIComponent(String(id))}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await refreshHomework()
    } catch (e) {
      console.error("Delete homework error:", e)
      alert("Ödev silinemedi.")
    }
  }

  function getStatusBadge(status?: string) {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Aktif
          </Badge>
        )
      case "expired":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Süresi Doldu
          </Badge>
        )
      default:
        return <Badge variant="secondary">Belirsiz</Badge>
    }
  }

  function getDaysRemaining(dueDate: string) {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const activeCount = useMemo(
    () => homeworkList.filter((hw) => hw.status === "active").length,
    [homeworkList],
  )
  const expiredCount = useMemo(
    () => homeworkList.filter((hw) => hw.status === "expired").length,
    [homeworkList],
  )

  return (
    <div className="space-y-6">
      {/* Bilgilendirme kutusu */}
      {showInfo && (
        <div className="flex justify-end">
          <div className="mt-2 mb-1 inline-flex items-start gap-3 rounded-lg border bg-card shadow-sm px-4 py-3 max-w-xl">
            <Info className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-xs sm:text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-0.5">
                Ödev sistemi geliştirme aşamasında
              </p>
              <p>
                Değerli öğretmenimiz, ödev sistemi geliştirilme
                aşamasındadır. Ödev ile ilgili görebileceğiniz
                istatistik ve sayılar şimdilik örnek verilerden
                oluşmaktadır.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismissInfo}
              className="ml-2 text-muted-foreground hover:text-foreground"
              aria-label="Bilgilendirmeyi kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ödev Yönetimi</h1>
          <p className="text-muted-foreground">
            Sınıflarınız için ödev oluşturun ve takip edin
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Trash2 className="h-4 w-4 mr-2" />
                Arşivi Temizle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Arşivi Temizle</DialogTitle>
                <DialogDescription>
                  Süresi dolmuş/eskimiş ödevler arşivden kaldırılacak. Bu
                  işlem geri alınamaz.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsArchiveDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button onClick={handleArchiveCleanup} variant="destructive">
                  Arşivi Temizle
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Ödev Oluştur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Yeni Ödev Oluştur</DialogTitle>
                <DialogDescription>
                  Sınıfınız için yeni bir ödev oluşturun ve teslim tarihi
                  belirleyin.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="class">Sınıf Seçin</Label>
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          classesLoading ? "Yükleniyor..." : "Sınıf seçin"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{" "}
                          {typeof c.studentCount === "number"
                            ? `(${c.studentCount} öğrenci)`
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {classesError && (
                    <p className="text-sm text-red-600 mt-1">
                      {classesError}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Ödev Başlığı</Label>
                  <Input
                    id="title"
                    placeholder="Ödev başlığını girin"
                    value={homeworkTitle}
                    onChange={(e) => setHomeworkTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Ödev Açıklaması</Label>
                  <Textarea
                    id="description"
                    placeholder="Ödev detaylarını ve yapılacakları açıklayın"
                    rows={4}
                    value={homeworkDescription}
                    onChange={(e) => setHomeworkDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Teslim Tarihi</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleCreateHomework}
                  disabled={!selectedClass || !homeworkTitle || !dueDate}
                >
                  Ödev Oluştur
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Toplam Ödev
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {homeworkList.length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aktif Ödev
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {activeCount}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Süresi Dolan
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {expiredCount}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ortalama Teslim
                </p>
                <p className="text-2xl font-bold text-foreground">
                  %
                  {Math.round(
                    homeworkList.reduce(
                      (acc, hw) =>
                        acc +
                        ((hw.submissions?.length || 0) /
                          (hw.totalStudents || 1)) *
                          100,
                      0,
                    ) / (homeworkList.length || 1),
                  )}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Homework List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Mevcut Ödevler
          </CardTitle>
          <CardDescription>
            Oluşturduğunuz ödevleri yönetin ve takip edin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listLoading && (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          )}
          {listError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{listError}</AlertDescription>
            </Alert>
          )}
          {!listLoading && !listError && homeworkList.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Henüz ödev oluşturulmamış.
              </p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                İlk Ödevi Oluştur
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {homeworkList.map((homework) => {
                const daysRemaining = homework.dueDate
                  ? getDaysRemaining(homework.dueDate)
                  : 0
                const submissionCount = homework.submissions?.length || 0
                const totalStudents = homework.totalStudents || 25
                const submissionRate = Math.round(
                  (submissionCount / totalStudents) * 100,
                )

                return (
                  <div
                    key={homework.id}
                    className="p-6 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {homework.title}
                          </h3>
                          {getStatusBadge(homework.status)}
                          {homework.status === "active" && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {daysRemaining > 0
                                ? `${daysRemaining} gün kaldı`
                                : "Bugün son gün"}
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className="text-xs"
                          >
                            Teslim: %{submissionRate}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {homework.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Sınıf:{" "}
                            {homework.className ?? homework.classId}
                          </span>
                          {homework.assignedDate && (
                            <span>
                              Verilme:{" "}
                              {new Date(
                                homework.assignedDate,
                              ).toLocaleDateString("tr-TR")}
                            </span>
                          )}
                          {homework.dueDate && (
                            <span>
                              Teslim:{" "}
                              {new Date(
                                homework.dueDate,
                              ).toLocaleDateString("tr-TR")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleEditHomework(homework)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 bg-transparent"
                          onClick={() =>
                            handleDeleteHomework(homework.id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
