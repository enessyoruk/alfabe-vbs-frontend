// app/teacher/exam-upload/page.tsx
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

  // classes
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [classesError, setClassesError] = useState<string | null>(null)

  // list
  const [examResults, setExamResults] = useState<GeneralExamItem[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  // dialogs/forms
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
  const [selectedFileBlobUrl, setSelectedFileBlobUrl] = useState<string>("")
  const [selectedExamForAnalysis, setSelectedExamForAnalysis] = useState<string>("")
  const [analysisContent, setAnalysisContent] = useState("")
  const [busy, setBusy] = useState(false)

  // Sınıf seviyeleri (5–8 sabit + DB’den gelenler)
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

  // Seçilen seviyeye göre dersleri filtrele
  const filteredClasses = useMemo(
    () =>
      classes.filter((c) =>
        selectedGrade ? String(c.grade ?? "") === selectedGrade : true,
      ),
    [classes, selectedGrade],
  )

  // Checkbox toggle
  function toggleClassSelection(id: string) {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  // ==== load classes from backend (VBS) ====
    useEffect(() => {
  const ctrl = new AbortController();

  (async () => {
    try {
      setClassesLoading(true);
      setClassesError(null);

      const res = await http.get<any>(endpoints.teacher.classes, {
        signal: ctrl.signal,
      });

      // gelen format teacher/classes → array veya items olabilir
      const arr = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
        ? res.items
        : [];

      const mapped: ClassItem[] = arr.map((x: any) => ({
        id: String(x.id ?? x.classId),
        name: String(
          x.name ??
            x.className ??
            x.dersAdi ??
            `Ders #${x.id ?? x.classId}`
        ),
        grade: x.grade ?? x.sinifSeviyesi ?? x.classLevel ?? null,
      }));

      setClasses(mapped);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setClassesError(e?.message || "Sınıf listesi alınamadı.");
    } finally {
      setClassesLoading(false);
    }
  })();

  return () => ctrl.abort();
}, []);




  // ==== list general exams (Next proxy) ====
  async function refreshExams() {
    try {
      setListLoading(true)
      setListError(null)

      const res = await fetch("/api/teacher/exams", {
        method: "GET",
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()

      const raw: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.exams)
        ? data.exams
        : []

      const list: GeneralExamItem[] = raw.map((x: any) => {
        const rawPath: string | undefined =
          x.fileUrl ?? x.filePath ?? x.file ?? x.imageUrl ?? undefined

        // Backend artık tam URL gönderiyor => direkt kullan
        const resolvedFileUrl = rawPath ?? ""

        const fileName: string | undefined =
          x.fileName ??
          (rawPath ? rawPath.split(/[\\/]/).pop() : undefined) ??
          undefined

        const uploadDateStr: string =
          x.uploadDate ?? x.createdAt ?? x.examDate ?? new Date().toISOString()

        return {
          id: x.id ?? x.examId ?? x.generalExamId ?? 0,
          classId: Number(x.classId ?? x.dersId ?? 0),
          className:
            x.className ??
            x.dersAdi ??
            x.class ??
            x.classTitle ??
            `Ders #${x.classId ?? x.dersId ?? ""}`,
          examTitle: x.examTitle ?? x.title ?? "",
          description: x.description ?? x.aciklama ?? null,
          uploadDate: uploadDateStr,
          fileName,
          fileUrl: resolvedFileUrl,
          studentCount: Number(x.studentCount ?? x.ogrenciSayisi ?? 0),
          hasAnalysis: Boolean(
            x.hasAnalysis ??
              x.analysisExists ??
              (typeof x.analysisCount === "number" && x.analysisCount > 0),
          ),
          analysis:
            x.analysis ??
            x.analysisSummary ??
            x.latestAnalysis ??
            x.latestAnalysisSummary ??
            null,
        }
      })

      setExamResults(list)
    } catch (e: any) {
      console.error("[exam-upload] refreshExams error", e)
      setListError(e?.message || "Sınavlar yüklenemedi.")
      setExamResults([])
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    refreshExams()
  }, [])

  // ==== image upload (Next proxy → backend exams/upload-image) ====
  async function uploadExamImage(file: File): Promise<string> {
    const form = new FormData()
    form.append("image", file)

    const res = await fetch("/api/teacher/exams/upload-image", {
      method: "POST",
      credentials: "include",
      body: form,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Upload HTTP ${res.status}`)
    }

    const data = await res.json()
    const fileUrl = data?.fileUrl as string | undefined

    if (!fileUrl) {
      throw new Error("Sunucudan fileUrl dönmedi.")
    }

    return fileUrl
  }

  // ==== file input ====
    // ==== file input ====
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Bazı ortamlarda MIME type boş gelebiliyor → uzantı ile de kontrol et
    const mimeOk = file.type?.startsWith("image/")
    const ext = file.name.split(".").pop()?.toLowerCase()
    const extOk = ext === "jpg" || ext === "jpeg" || ext === "png"

    if (!mimeOk && !extOk) {
      // Geçersiz dosya → state ve input'u temizle
      setSelectedFile(null)
      setSelectedFileBlobUrl("")
      e.target.value = ""
      alert("Lütfen yalnızca görüntü dosyası seçin (JPG/PNG).")
      return
    }

    // Önceki blob URL varsa temizle
    if (selectedFileBlobUrl) {
      URL.revokeObjectURL(selectedFileBlobUrl)
    }

    setSelectedFile(file)
    const blobUrl = URL.createObjectURL(file)
    setSelectedFileBlobUrl(blobUrl)
  }


  // ==== create general exam (VBS, multi-class) ====
  async function handleUploadExam() {
  if (selectedClassIds.length === 0 || !examTitle || !selectedFile) {
    alert("En az bir ders, başlık ve dosya zorunlu.")
    return
  }

  setBusy(true)
  try {
    // 1) Resmi upload et
    const filePath = await uploadExamImage(selectedFile)

    // 2) Kullanıcıyı oku
    const raw = localStorage.getItem("vbs:user")
    const parsed = raw ? JSON.parse(raw) : null
    const user = parsed?.user || null

    // 3) Backend'in istediği TeacherId (Ogretmenler.Id)
    const teacherId = user?.teacherNumericId
      ? Number(user.teacherNumericId)
      : null

    // 4) Payload (TEK teacherId)
    const payload = {
      classIds: selectedClassIds.map((id) => Number(id)),
      examTitle,
      description: examDescription || null,
      fileUrl: filePath,
      teacherId
    }

    await http.post(endpoints.teacher.generalExams, payload)

    // Temizlik
    setIsUploadDialogOpen(false)
    setSelectedGrade("")
    setSelectedClassIds([])
    setExamTitle("")
    setExamDescription("")
    setSelectedFile(null)
    setSelectedFileBlobUrl("")

    await refreshExams()

  } catch (e: any) {
    console.error(e)
    alert(e?.message || "Yükleme başarısız.")
  } finally {
    setBusy(false)
  }
}



  // ==== create analysis for general exam (VBS) ====
  async function handleCreateAnalysis() {
    if (!selectedExamForAnalysis || !analysisContent.trim()) {
      alert("Sınav seçin ve analiz içeriği girin.")
      return
    }
    setBusy(true)
    try {
      const payload = {
        examId: Number(selectedExamForAnalysis),
        summary: analysisContent,
        detailsJson: null as string | null,
      }

      await http.post(endpoints.teacher.generalExamAnalysis, payload)

      setIsAnalysisDialogOpen(false)
      setSelectedExamForAnalysis("")
      setAnalysisContent("")

      await refreshExams()
    } catch (e: any) {
      console.error(e)
      alert(e?.message || "Analiz oluşturulamadı.")
    } finally {
      setBusy(false)
    }
  }

  // ==== delete general exam (VBS) ====
  async function handleDeleteExam(id: string | number) {
    if (!confirm("Bu sınavı silmek istediğinizden emin misiniz?")) return
    try {
      await http.delete(
        `${endpoints.teacher.generalExams}?id=${encodeURIComponent(String(id))}`,
      )
      await refreshExams()
    } catch (e: any) {
      console.error(e)
      alert(e?.message || "Silme başarısız.")
    }
  }

  function handleImagePreview(url: string) {
    setPreviewImageUrl(url || "")
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
  const map = new Map<number, number>();

  for (const exam of examResults) {
    const cid = Number(exam.classId);
    const sc = Number(exam.studentCount || 0);

    if (!map.has(cid)) {
      map.set(cid, sc);
    }
  }

  let total = 0;
  map.forEach((count) => (total += count));
  return total;
}, [examResults]);

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/teacher/classes")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri Dön
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Sınav Sonuçları Yönetimi
            </h1>
            <p className="text-muted-foreground">
              Sınıf geneli sınav sonuçlarını yükleyin ve isteğe bağlı analiz oluşturun
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* analysis */}
          <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analiz Oluştur
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] w-full">
              <DialogHeader>
                <DialogTitle>Sınav Analizi Oluştur</DialogTitle>
                <DialogDescription>
                  Seçili sınav için öğrenci analizi oluşturun ve paylaşın.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="exam-select">Sınav Seçin</Label>
                  <Select
  value={selectedExamForAnalysis}
  onValueChange={setSelectedExamForAnalysis}
>
  <SelectTrigger>
    <SelectValue placeholder="Analiz oluşturulacak sınavı seçin" />
  </SelectTrigger>
  <SelectContent className="max-h-56 overflow-y-auto">
    {examResults.map((exam) => (
      <SelectItem key={exam.id} value={String(exam.id)}>
        {exam.examTitle} - {exam.className}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

                </div>
                <div className="space-y-2">
                  <Label htmlFor="analysis">Analiz İçeriği</Label>
                  <Textarea
                    id="analysis"
                    placeholder="Sınav analizi, öğrenci performansları, öneriler..."
                    rows={6}
                    value={analysisContent}
                    onChange={(e) => setAnalysisContent(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAnalysisDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleCreateAnalysis}
                  disabled={!selectedExamForAnalysis || !analysisContent || busy}
                >
                  {busy ? "Oluşturuluyor..." : "Analiz Oluştur"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* upload */}
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Sınav Sonucu Yükle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] w-full max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Sınıf Geneli Sınav Sonucu Yükle</DialogTitle>
                <DialogDescription>
                  Sınıf geneli sınav sonucu fotoğrafını bir veya birden fazla ders için paylaşın.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Sınıf seviyesi */}
                <div className="space-y-2">
                  <Label htmlFor="grade">Sınıf Seviyesi</Label>
                  <Select
                    value={selectedGrade}
                    onValueChange={(val) => {
                      setSelectedGrade(val)
                      setSelectedClassIds([])
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          classesLoading ? "Yükleniyor..." : "Sınıf seviyesi seçin"
                        }
                      />
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

                {/* Ders seçimi (multi) */}
                <div className="space-y-2">
                  <Label>Ders Seçin (Birden Fazla Seçebilirsiniz)</Label>
                  {classesLoading && (
                    <p className="text-sm text-muted-foreground">Sınıflar yükleniyor…</p>
                  )}
                  {!classesLoading && filteredClasses.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Bu sınıf seviyesine bağlı ders bulunamadı.
                    </p>
                  )}
                  {!classesLoading && filteredClasses.length > 0 && (
                    <div className="border rounded-md p-3 max-h-40 overflow-auto">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {filteredClasses.map((c) => (
                          <label
                            key={c.id}
                            className="inline-flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 border rounded"
                              checked={selectedClassIds.includes(c.id)}
                              onChange={() => toggleClassSelection(c.id)}
                            />
                            <span>{c.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {classesError && (
                    <p className="text-sm text-red-600 mt-1">{classesError}</p>
                  )}
                </div>

                {/* Sınav başlığı */}
                <div className="space-y-2">
                  <Label htmlFor="title">Sınav Başlığı</Label>
                  <Input
                    id="title"
                    placeholder="Sınav adını girin (örn: 1. Yazılı - Fonksiyonlar)"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                  />
                </div>

                {/* Açıklama */}
                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama (İsteğe Bağlı)</Label>
                  <Textarea
                    id="description"
                    placeholder="Sınav hakkında genel bilgiler..."
                    rows={3}
                    value={examDescription}
                    onChange={(e) => setExamDescription(e.target.value)}
                  />
                </div>

                {/* Fotoğraf */}
                <div className="space-y-2">
                  <Label htmlFor="file">Sınav Sonucu Fotoğrafı (JPG/PNG)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input
                      id="file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="file" className="cursor-pointer">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {selectedFile
                          ? selectedFile.name
                          : "Sınıf geneli sonuç fotoğrafını seçin"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG formatları desteklenir
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button
                onClick={handleUploadExam}
                  disabled={
                  selectedClassIds.length === 0 ||
                      !examTitle ||
                      !selectedFile ||
                        busy
                    }
                        >  {busy ? "Yükleniyor..." : "Yükle"}
                      </Button>

              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Toplam Sınav
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {examResults.length}
                </p>
              </div>
              <FileImage className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Bu Hafta
                </p>
                <p className="text-2xl font-bold text-green-600">{thisWeek}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Toplam Öğrenci
                </p>
                <p className="text-2xl font-bold text-secondary">
  {totalUniqueStudents}
</p>

              </div>
              <Users className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Analiz Oluşturulan
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {examResults.filter((e) => e.hasAnalysis).length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Sınıf Geneli Sınav Sonuçları
          </CardTitle>
          <CardDescription>
            Yüklediğiniz sınav sonuçlarını görüntüleyin ve isteğe bağlı analiz
            oluşturun
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

          {!listLoading && !listError && examResults.length === 0 ? (
            <div className="text-center py-8">
              <FileImage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Henüz sınav sonucu yüklenmemiş.
              </p>
              <Button
                className="mt-4"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                İlk Sınav Sonucunu Yükle
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {examResults.map((exam) => (
                <div
                  key={exam.id}
                  className="p-6 border border-border rounded-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {exam.examTitle}
                        </h3>
                        <Badge variant="outline">{exam.className}</Badge>
                        {exam.hasAnalysis && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Analiz Mevcut
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>{exam.studentCount} öğrenci</span>
                        <span>
                          {new Date(exam.uploadDate).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                      {exam.description && (
                        <p className="text-sm text-muted-foreground">
                          {exam.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {exam.hasAnalysis && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 bg-transparent"
                          onClick={() => handleAnalysisView(exam.analysis)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 bg-transparent"
                        onClick={() => handleDeleteExam(exam.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileImage className="h-4 w-4" />
                      <span>{exam.fileName ?? "dosya.jpg"}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!exam.fileUrl) {
                            alert("Dosya yolu mevcut değil.")
                            return
                          }
                          const a = document.createElement("a")
                          a.href = exam.fileUrl
                          a.download = exam.fileName ?? "exam.jpg"
                          a.click()
                        }}
                      >
                        İndir
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleImagePreview(exam.fileUrl || "/exam-result-document.jpg")
                        }
                      >
                        Detayları Gör
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* image preview */}
      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Sınav Sonucu Önizleme
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsImagePreviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-4 bg-muted/30 rounded-lg overflow-auto max-h-[75vh]">
            <img
              src={previewImageUrl || "/exam-result-document.jpg"}
              alt="Sınav Sonucu"
              className="w-full h-auto object-contain rounded-lg max-w-full"
              onError={(e) => {
                e.currentTarget.src = "/exam-result-document.jpg"
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* analysis view */}
      <Dialog open={isAnalysisViewOpen} onOpenChange={setIsAnalysisViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sınav Analizi</DialogTitle>
            <DialogDescription>
              Öğretmen tarafından oluşturulan sınav analizi
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {viewAnalysisContent}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
