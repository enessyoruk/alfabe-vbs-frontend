"use client"

import { useState, useEffect, useMemo } from "react"
import type { ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  Plus,
  FileImage,
  Trash2,
  Calendar,
  Users,
  BarChart3,
  Share2,
  ArrowLeft,
  X,
} from "lucide-react"

import { http, endpoints } from "@/lib/api"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ""

type ClassItem = {
  id: string
  name: string
  grade?: string | number | null
}

type GeneralExamItem = {
  id: string | number
  classId: number
  className: string
  examTitle: string
  description?: string | null
  uploadDate: string
  fileName?: string
  fileUrl: string
  studentCount: number
  hasAnalysis?: boolean
  analysis?: string | null
}

export default function ExamUploadPage() {
  const router = useRouter()

  const user = useMemo(() => {
    if (typeof window === "undefined") return null
    try {
      return JSON.parse(window.localStorage.getItem("vbs:user") || "null")
    } catch {
      return null
    }
  }, [])

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [classesError, setClassesError] = useState<string | null>(null)

  const [examResults, setExamResults] = useState<GeneralExamItem[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false)
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState("")
  const [isAnalysisViewOpen, setIsAnalysisViewOpen] = useState(false)
  const [viewAnalysisContent, setViewAnalysisContent] = useState("")

  const [selectedGrade, setSelectedGrade] = useState("")
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [examTitle, setExamTitle] = useState("")
  const [examDescription, setExamDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFileBlobUrl, setSelectedFileBlobUrl] = useState("")
  const [selectedExamForAnalysis, setSelectedExamForAnalysis] = useState("")
  const [analysisContent, setAnalysisContent] = useState("")
  const [busy, setBusy] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
const [deleteTargetId, setDeleteTargetId] = useState<string | number | null>(null)

  const gradeOptions = useMemo(() => {
    const dynamic = Array.from(
      new Set(
        classes
          .map((c) => (c.grade != null ? String(c.grade) : null))
          .filter((g): g is string => !!g),
      ),
    )

    const base = ["5", "6", "7", "8"]

    return Array.from(new Set([...dynamic, ...base])).sort(
      (a, b) => Number(a) - Number(b),
    )
  }, [classes])

  const filteredClasses = useMemo(
    () =>
      classes.filter((c) =>
        selectedGrade ? String(c.grade ?? "") === selectedGrade : true,
      ),
    [classes, selectedGrade],
  )

  function toggleClassSelection(id: string) {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }
  function requestDelete(id: string | number) {
  setDeleteTargetId(id)
  setDeleteConfirmOpen(true)
}

  useEffect(() => {
    const ctrl = new AbortController()

    ;(async () => {
      try {
        setClassesLoading(true)
        setClassesError(null)

        const res = await http.get<any>(endpoints.teacher.classes, {
          signal: ctrl.signal,
        })

        const arr = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
          ? res.items
          : []

        const mapped: ClassItem[] = arr.map((x: any) => ({
          id: String(x.id ?? x.classId),
          name: String(
            x.name ??
              x.className ??
              x.dersAdi ??
              `Ders #${x.id ?? x.classId}`,
          ),
          grade: x.grade ?? x.sinifSeviyesi ?? x.classLevel ?? null,
        }))

        setClasses(mapped)
      } catch (e: any) {
        if (e?.name === "AbortError") return
        setClassesError(e?.message || "Sınıf listesi alınamadı.")
      } finally {
        setClassesLoading(false)
      }
    })()

    return () => ctrl.abort()
  }, [])

  async function refreshExams() {
    try {
      setListLoading(true)
      setListError(null)

      const res = await fetch(endpoints.teacher.exams, {
        method: "GET",
        credentials: "include",
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()

      const raw = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.exams)
        ? data.exams
        : []

      const list: GeneralExamItem[] = raw.map((x: any) => {
        const rawPath =
          x.fileUrl ?? x.filePath ?? x.file ?? x.imageUrl ?? undefined

        const resolvedFileUrl = rawPath ?? ""

        const fileName =
          x.fileName ??
          (rawPath ? rawPath.split(/[\\/]/).pop() : undefined)

        const uploadDateStr =
          x.uploadDate ?? x.createdAt ?? x.examDate ?? new Date().toISOString()

        return {
          id: x.id ?? x.examId ?? x.generalExamId ?? 0,
          classId: Number(x.classId ?? x.dersId ?? 0),
          className:
            x.className ??
            x.dersAdi ??
            `Ders #${x.classId ?? x.dersId ?? ""}`,
          examTitle: x.examTitle ?? x.title ?? "",
          description: x.description ?? null,
          uploadDate: uploadDateStr,
          fileName,
          fileUrl: resolvedFileUrl,
          studentCount: Number(x.studentCount ?? 0),
          hasAnalysis: Boolean(
            x.hasAnalysis ??
              x.analysisExists ??
              (typeof x.analysisCount === "number" && x.analysisCount > 0),
          ),
          analysis:
            x.latestAnalysisSummary ??
            x.analysis ??
            x.analysisSummary ??
            x.latestAnalysis ??
            null,
        }
      })

      setExamResults(list)
    } catch (e: any) {
      setListError(e?.message || "Sınavlar yüklenemedi.")
      setExamResults([])
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    refreshExams()
  }, [])

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const mimeOk = file.type?.startsWith("image/")
    const ext = file.name.split(".").pop()?.toLowerCase()
    const extOk = ext === "jpg" || ext === "jpeg" || ext === "png"

    if (!mimeOk && !extOk) {
      setSelectedFile(null)
      setSelectedFileBlobUrl("")
      e.target.value = ""
      alert("Yalnızca JPG/PNG yükleyebilirsiniz.")
      return
    }

    if (selectedFileBlobUrl) URL.revokeObjectURL(selectedFileBlobUrl)

    setSelectedFile(file)
    setSelectedFileBlobUrl(URL.createObjectURL(file))
  }

async function handleUploadExam() {
  if (selectedClassIds.length === 0 || !examTitle || !selectedFile) {
    toast.error("Ders, başlık ve dosya zorunludur.", {
      duration: 2200,
      position: "bottom-right",
    })
    return
  }

  setBusy(true)
  try {
    const form = new FormData()
    form.append("Image", selectedFile)

    const uploadRes = await fetch("/api/vbs/teacher/exams/upload/image", {
      method: "POST",
      credentials: "include",
      body: form,
    })

    if (!uploadRes.ok) throw new Error(`Upload HTTP ${uploadRes.status}`)

    const uploadJson = await uploadRes.json()
    if (!uploadJson?.fileUrl) throw new Error("Dosya URL'i alınamadı.")

    const filePath = uploadJson.fileUrl

    const parsed = JSON.parse(localStorage.getItem("vbs:user") || "{}")
    const teacherId = parsed?.user?.teacherNumericId
      ? Number(parsed.user.teacherNumericId)
      : null

    const payload = {
      classIds: selectedClassIds.map((x) => Number(x)),
      examTitle,
      description: examDescription || null,
      fileUrl: filePath,
      teacherId,
    }

    await http.post(endpoints.teacher.exams, payload)

    toast.success("Sınav sonucu başarıyla yüklendi!", {
      duration: 1800,
      position: "bottom-right",
    })

    setIsUploadDialogOpen(false)
    setSelectedGrade("")
    setSelectedClassIds([])
    setExamTitle("")
    setExamDescription("")
    setSelectedFile(null)
    setSelectedFileBlobUrl("")

    await refreshExams()
  } catch (e: any) {
    toast.error("Yükleme başarısız. Lütfen tekrar deneyin.", {
      duration: 2500,
      position: "bottom-right",
    })
  } finally {
    setBusy(false)
  }
}

async function handleCreateAnalysis() {
  if (!selectedExamForAnalysis || !analysisContent.trim()) {
    toast.error("Sınav ve analiz içeriği zorunludur.", {
      duration: 2200,
      position: "bottom-right",
    })
    return
  }

  setBusy(true)
  try {
    const payload = {
      examId: Number(selectedExamForAnalysis),
      summary: analysisContent,
      detailsJson: null,
    }

    await http.post(endpoints.teacher.generalExamAnalysis, payload)

    toast.success("Analiz başarıyla oluşturuldu!", {
      duration: 1800,
      position: "bottom-right",
    })

    setIsAnalysisDialogOpen(false)
    setSelectedExamForAnalysis("")
    setAnalysisContent("")

    await refreshExams()
  } catch (e: any) {
    toast.error("Analiz oluşturulamadı. Lütfen tekrar deneyin.", {
      duration: 2500,
      position: "bottom-right",
    })
  } finally {
    setBusy(false)
  }
}

  async function handleDeleteExam() {
  if (!deleteTargetId) return

  try {
    await http.post(`${endpoints.teacher.examsDelete}?id=${deleteTargetId}`)

    toast.success("Sınav başarıyla silindi!", {
      duration: 1800,
      position: "bottom-right",
    })

    setDeleteConfirmOpen(false)
    setDeleteTargetId(null)

    await refreshExams()
  } catch (err: any) {
    toast.error("Silme başarısız", {
      duration: 2000,
      position: "bottom-right",
    })
  }
}

  function handleImagePreview(url: string) {
    setPreviewImageUrl(url)
    setIsImagePreviewOpen(true)
  }

  function handleAnalysisView(text?: string | null) {
    setViewAnalysisContent(text || "")
    setIsAnalysisViewOpen(true)
  }

  const thisWeek = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return examResults.filter((e) => new Date(e.uploadDate) >= weekAgo).length
  }, [examResults])

  const totalUniqueStudents = useMemo(() => {
    const map = new Map<number, number>()
    examResults.forEach((e) => {
      if (!map.has(e.classId)) map.set(e.classId, e.studentCount)
    })
    return Array.from(map.values()).reduce((a, b) => a + b, 0)
  }, [examResults])

  if (classesLoading || listLoading) {
    return (
      <div className="flex items-center justify-center min-h-[380px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Sınav verileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/teacher/classes")}
          >
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sınav Sonuçları Yönetimi</h1>
            <p className="text-muted-foreground">
              Sınıf geneli sonuçları yükleyin ve analiz oluşturun
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* ANALYSIS */}
          <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analiz Oluştur
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sınav Analizi Oluştur</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <Label>Sınav Seçin</Label>
                  <Select
                    value={selectedExamForAnalysis}
                    onValueChange={setSelectedExamForAnalysis}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bir sınav seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {examResults.map((exam) => (
                        <SelectItem key={exam.id} value={String(exam.id)}>
                          {exam.examTitle} - {exam.className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Analiz İçeriği</Label>
                  <Textarea
                    rows={6}
                    value={analysisContent}
                    onChange={(e) => setAnalysisContent(e.target.value)}
                    placeholder="Analiz detaylarını girin"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAnalysisDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleCreateAnalysis} disabled={busy}>
                  {busy ? "Oluşturuluyor..." : "Oluştur"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* UPLOAD */}
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white">
                <Plus className="h-4 w-4 mr-2" />
                Sınav Sonucu Yükle
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-[650px] w-full sm:w-auto px-4">
              <DialogHeader>
                <DialogTitle>Sınav Sonucu Yükle</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* GRADE */}
                <div>
                  <Label>Sınıf Seviyesi</Label>
                  <Select
                    value={selectedGrade}
                    onValueChange={(val) => {
                      setSelectedGrade(val)
                      setSelectedClassIds([])
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seviye seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}. Sınıf
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* CLASSES MULTIPLE */}
                <div>
                  <Label>Ders Seçin</Label>
                  <div className="border p-3 rounded-md max-h-40 overflow-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {filteredClasses.map((c) => (
                        <label
  key={c.id}
  className="
    flex items-center gap-2 
    text-sm 
    sm:text-base
  "
>
  <input
    type="checkbox"
    checked={selectedClassIds.includes(c.id)}
    onChange={() => toggleClassSelection(c.id)}
  />
  <span className="truncate max-w-[150px] sm:max-w-none">
    {c.name}
  </span>
</label>

                      ))}
                    </div>
                  </div>
                </div>

                {/* TITLE */}
                <div>
                  <Label>Sınav Başlığı</Label>
                  <Input
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    placeholder="Örn: 1. Yazılı"
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <Label>Açıklama</Label>
                  <Textarea
                    rows={3}
                    value={examDescription}
                    onChange={(e) => setExamDescription(e.target.value)}
                    placeholder="İsteğe bağlı açıklama..."
                  />
                </div>

                {/* FILE */}
                <div>
                  <Label>Sonuç Fotoğrafı</Label>
                  <div className="border-2 border-dashed p-6 text-center rounded-lg">
                    <input
                      id="file"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="file" className="cursor-pointer block">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <p>{selectedFile ? selectedFile.name : "Dosya seçin"}</p>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  İptal
                </Button>
                <Button
                  onClick={handleUploadExam}
                  disabled={!selectedFile || busy || selectedClassIds.length === 0}
                >
                  {busy ? "Yükleniyor..." : "Yükle"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Toplam Sınav</p>
          <p className="text-2xl font-bold">{examResults.length}</p>
        </CardContent></Card>

        <Card><CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Bu Hafta</p>
          <p className="text-2xl font-bold text-green-600">{thisWeek}</p>
        </CardContent></Card>

        <Card><CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Toplam Öğrenci</p>
          <p className="text-2xl font-bold">{totalUniqueStudents}</p>
        </CardContent></Card>

        <Card><CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Analiz Oluşturulan</p>
          <p className="text-2xl font-bold">
            {examResults.filter((e) => e.hasAnalysis).length}
          </p>
        </CardContent></Card>
      </div>

      {/* LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Sınav Sonuçları</CardTitle>
          <CardDescription>Yüklediğiniz sonuçlar</CardDescription>
        </CardHeader>
        <CardContent>
          {listError && (
            <Alert variant="destructive">
              <AlertDescription>{listError}</AlertDescription>
            </Alert>
          )}

          {!listError && examResults.length === 0 ? (
            <div className="text-center py-8">
              <FileImage className="h-12 w-12 mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz sınav yüklenmedi.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {examResults.map((exam) => (
  <div key={exam.id} className="p-6 border rounded-lg space-y-4">

   {/* BAŞLIK + BUTONLAR */}
<div
  className="
    flex flex-col gap-2
    sm:flex-row sm:items-start sm:justify-between
  "
>
  {/* SOL: Başlık (tek satır, küçülür) */}
  <h3
    className="
      font-semibold
      text-[clamp(0.9rem,3vw,1.2rem)]
      whitespace-nowrap
      overflow-hidden
      text-ellipsis
      min-w-0
      max-w-[70%]   /* PC’de butonlara çarpmasın */
    "
  >
    {exam.examTitle}
  </h3>

  {/* SAĞ: Butonlar (PC’de sağ üst köşede durur) */}
  <div
    className="
      flex gap-2 
      sm:justify-end 
      flex-shrink-0
    "
  >
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        const clean = exam.fileUrl.replace(/^https?:\/\/[^/]+/, "")
        const url = `/api/vbs/teacher/exams/download?path=${encodeURIComponent(clean)}`
        const a = document.createElement("a")
        a.href = url
        a.download = exam.fileName ?? "exam.jpg"
        document.body.appendChild(a)
        a.click()
        a.remove()
      }}
    >
      İndir
    </Button>

    <Button
      size="sm"
      variant="outline"
      onClick={() => handleImagePreview(exam.fileUrl)}
    >
      Detayları Gör
    </Button>

    {exam.hasAnalysis && (
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleAnalysisView(exam.analysis)}
      >
        <Share2 className="h-4 w-4" />
      </Button>
    )}

    <Button
      size="sm"
      variant="outline"
      className="text-red-600"
      onClick={() => requestDelete(exam.id)}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</div>

    {/* SINIF + ANALİZ BADGE */}
    <div className="flex items-center gap-2">
      {/* Sınıf adı – tek satır */}
      <Badge className="whitespace-nowrap max-w-[140px] overflow-hidden text-ellipsis">
        {exam.className}
      </Badge>

      {exam.hasAnalysis && (
        <Badge className="bg-green-200 text-green-900 whitespace-nowrap">
          Analiz Mevcut
        </Badge>
      )}
    </div>

    {/* öğrenci sayısı + tarih */}
    <p className="text-sm text-muted-foreground">
      {exam.studentCount} öğrenci •{" "}
      {new Date(exam.uploadDate).toLocaleDateString("tr-TR")}
    </p>

    {/* açıklama */}
    {exam.description && (
      <p className="text-sm text-muted-foreground">{exam.description}</p>
    )}

    {/* DOSYA ADI — tek satır + otomatik küçülme */}
    <div className="flex items-center gap-2 text-sm">
      <FileImage className="h-4 w-4" />
      <span
        className="
          whitespace-nowrap 
          overflow-hidden 
          text-ellipsis 
          max-w-full 
          text-[clamp(0.75rem,3vw,0.9rem)]
        "
      >
        {exam.fileName ?? "dosya.jpg"}
      </span>
    </div>

  </div>
))}

            </div>
          )}
        </CardContent>
      </Card>

      {/* IMAGE PREVIEW */}
      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent className="max-w-[900px]">
          <DialogHeader>
            <DialogTitle>
              Sınav Sonucu Önizleme
              <Button variant="ghost" className="float-right" onClick={() => setIsImagePreviewOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 bg-muted rounded-lg max-h-[75vh] overflow-auto">
            <img
              src={previewImageUrl}
              alt="Sınav Sonucu"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ANALYSIS VIEW */}
      <Dialog open={isAnalysisViewOpen} onOpenChange={setIsAnalysisViewOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sınav Analizi</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-lg">
            <p className="whitespace-pre-wrap text-sm">
              {viewAnalysisContent}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
<Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Sınavı Sil</DialogTitle>
      <DialogDescription>
        Bu sınavı ve ilişkili analizleri silmek istediğinize emin misiniz?
      </DialogDescription>
    </DialogHeader>

    <div className="flex justify-end gap-2 mt-4">
      <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
        Vazgeç
      </Button>
      <Button variant="destructive" onClick={handleDeleteExam}>
        Sil
      </Button>
    </div>
  </DialogContent>
</Dialog>

    
    
    </div>

    
  )
}
