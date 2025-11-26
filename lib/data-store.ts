// lib/data-store.ts
// Merkezi mock veri deposu (kalıcı: localStorage)
// - Tarayıcıda persist eder, SSR/edge güvenli kontroller içerir
// - İleride backend’e taşımak kolay: sadece load/save katmanını değiştir

import { getLocalJson, setLocalJson, isBrowser } from "@/lib/utils"
import { notificationService } from "@/lib/notification-service"

/* ======================= Türler ======================= */
export type StudentId = string
export type ParentId = string
export type TeacherId = string
export type ClassId = string

export type HomeworkSubmissionStatus = "pending" | "completed"
export type HomeworkStatus = "active" | "closed"

export interface HomeworkSubmission {
  studentId: StudentId
  studentName: string
  status: HomeworkSubmissionStatus
  submittedDate: string | null
  grade: string | null
  feedback: string | null
}

export interface Homework {
  id: string
  teacherId: TeacherId
  classId: ClassId
  className: string
  title: string
  description: string
  subject: string
  assignedDate: string // ISO
  dueDate: string      // ISO
  status: HomeworkStatus
  submissions: HomeworkSubmission[]
}

export interface ExamResult {
  id: string
  teacherId: TeacherId
  studentId: StudentId
  studentName: string
  classId: ClassId
  className: string
  subject: string
  examTitle: string
  examDate: string // ISO
  uploadDate: string // ISO
  score: number
  maxScore: number
  grade: string
  classAverage: number
  ranking: number
  totalStudents: number
  topics: string[]
  feedback: string
  fileName: string
  fileUrl: string
}

export interface GeneralExamResult {
  id: string
  teacherId: TeacherId
  classId: ClassId
  className: string
  examTitle: string
  description: string
  uploadDate: string // ISO
  fileName: string
  fileUrl: string
  studentCount: number
  hasAnalysis: boolean
  analysis: string | null
}

/* ======================= Varsayılan Seed ======================= */
// Parent-Student mapping
const DEFAULT_PARENT_STUDENT_MAP: Record<ParentId, StudentId[]> = {
  "1": ["1", "2"],
  "2": ["3"],
}

// Teacher-Class mapping
const DEFAULT_TEACHER_CLASS_MAP: Record<TeacherId, ClassId[]> = {
  "1": ["1", "2"],
  "2": ["3"],
}

const DEFAULT_HOMEWORK: Homework[] = [
  {
    id: "1",
    teacherId: "1",
    classId: "1",
    className: "9-A Matematik",
    title: "Fonksiyonlar Konu Tekrarı",
    description:
      "Sayfa 45-50 arası sorular çözülecek. Grafik çizimi ve fonksiyon tanımları üzerinde durulacak.",
    subject: "Matematik",
    assignedDate: "2024-01-15",
    dueDate: "2024-01-25",
    status: "active",
    submissions: [
      {
        studentId: "1",
        studentName: "Elif Yılmaz",
        status: "pending",
        submittedDate: null,
        grade: null,
        feedback: null,
      },
      {
        studentId: "2",
        studentName: "Can Demir",
        status: "completed",
        submittedDate: "2024-01-20",
        grade: "85/100",
        feedback: "İyi çalışma!",
      },
    ],
  },
]

const DEFAULT_EXAM_RESULTS: ExamResult[] = [
  {
    id: "1",
    teacherId: "1",
    studentId: "1",
    studentName: "Elif Yılmaz",
    classId: "1",
    className: "9-A Matematik",
    subject: "Matematik",
    examTitle: "Fonksiyonlar Sınavı",
    examDate: "2024-01-15",
    uploadDate: "2024-01-16",
    score: 85,
    maxScore: 100,
    grade: "B+",
    classAverage: 78.5,
    ranking: 3,
    totalStudents: 28,
    topics: ["Fonksiyonlar", "Grafik Çizimi", "Denklem Çözme"],
    feedback: "Fonksiyon kavramını iyi anlamış, grafik çiziminde başarılı.",
    fileName: "elif_fonksiyonlar_sinavi.jpg",
    fileUrl: "/uploads/exams/elif_fonksiyonlar_sinavi.jpg",
  },
  {
    id: "2",
    teacherId: "1",
    studentId: "1",
    studentName: "Elif Yılmaz",
    classId: "1",
    className: "9-A Matematik",
    subject: "Matematik",
    examTitle: "Türev Sınavı",
    examDate: "2024-01-08",
    uploadDate: "2024-01-09",
    score: 92,
    maxScore: 100,
    grade: "A-",
    classAverage: 82.1,
    ranking: 2,
    totalStudents: 28,
    topics: ["Türev Kuralları", "Türev Uygulamaları"],
    feedback: "Mükemmel performans! Türev kurallarını çok iyi uygulamış.",
    fileName: "elif_turev_sinavi.jpg",
    fileUrl: "/uploads/exams/elif_turev_sinavi.jpg",
  },
  {
    id: "3",
    teacherId: "1",
    studentId: "2",
    studentName: "Can Yılmaz",
    classId: "2",
    className: "7-B Fen",
    subject: "Fen Bilgisi",
    examTitle: "Işık ve Ses",
    examDate: "2024-01-12",
    uploadDate: "2024-01-13",
    score: 88,
    maxScore: 100,
    grade: "A-",
    classAverage: 75.3,
    ranking: 4,
    totalStudents: 25,
    topics: ["Işığın Özellikleri", "Ses Dalgaları"],
    feedback: "Konuları çok iyi kavramış, özellikle ışık konusunda başarılı.",
    fileName: "can_isik_ses_sinavi.jpg",
    fileUrl: "/uploads/exams/can_isik_ses_sinavi.jpg",
  },
]

const DEFAULT_GENERAL_EXAM_RESULTS: GeneralExamResult[] = [
  {
    id: "1",
    teacherId: "1",
    classId: "1",
    className: "9-A Matematik",
    examTitle: "Fonksiyonlar Sınavı",
    description: "9-A sınıfı fonksiyonlar konusu yazılı sınavı genel sonuçları",
    uploadDate: "2024-01-15",
    fileName: "9a_fonksiyonlar_sinavi_genel.jpg",
    fileUrl: "/uploads/exams/9a_fonksiyonlar_sinavi_genel.jpg",
    studentCount: 28,
    hasAnalysis: false,
    analysis: null,
  },
  {
    id: "2",
    teacherId: "1",
    classId: "2",
    className: "10-B Matematik",
    examTitle: "Türev Sınavı",
    description: "10-B sınıfı türev konusu yazılı sınavı genel sonuçları",
    uploadDate: "2024-01-12",
    fileName: "10b_turev_sinavi_genel.jpg",
    fileUrl: "/uploads/exams/10b_turev_sinavi_genel.jpg",
    studentCount: 25,
    hasAnalysis: true,
    analysis:
      "Sınıf geneli başarılı performans gösterdi. Türev kuralları konusunda güçlü, uygulama sorularında gelişim gerekli.",
  },
]

/* ======================= LS Anahtarları ======================= */
const LS_KEYS = {
  PARENT_MAP: "vbs:parent-students",
  TEACHER_MAP: "vbs:teacher-classes",
  HOMEWORK: "vbs:homeworks",
  EXAMS: "vbs:exam-results",
  EXAMS_GENERAL: "vbs:exam-results-general",
}

/* ======================= Bellek + Persist ======================= */
let parentStudentMap: Record<ParentId, StudentId[]> =
  getLocalJson<Record<ParentId, StudentId[]>>(LS_KEYS.PARENT_MAP, DEFAULT_PARENT_STUDENT_MAP) ||
  DEFAULT_PARENT_STUDENT_MAP

let teacherClassMap: Record<TeacherId, ClassId[]> =
  getLocalJson<Record<TeacherId, ClassId[]>>(LS_KEYS.TEACHER_MAP, DEFAULT_TEACHER_CLASS_MAP) ||
  DEFAULT_TEACHER_CLASS_MAP

let homeworkStore: Homework[] =
  getLocalJson<Homework[]>(LS_KEYS.HOMEWORK, DEFAULT_HOMEWORK) || DEFAULT_HOMEWORK

let examResultsStore: ExamResult[] =
  getLocalJson<ExamResult[]>(LS_KEYS.EXAMS, DEFAULT_EXAM_RESULTS) || DEFAULT_EXAM_RESULTS

let generalExamResultsStore: GeneralExamResult[] =
  getLocalJson<GeneralExamResult[]>(LS_KEYS.EXAMS_GENERAL, DEFAULT_GENERAL_EXAM_RESULTS) ||
  DEFAULT_GENERAL_EXAM_RESULTS

function persistAll() {
  if (!isBrowser) return
  setLocalJson(LS_KEYS.PARENT_MAP, parentStudentMap)
  setLocalJson(LS_KEYS.TEACHER_MAP, teacherClassMap)
  setLocalJson(LS_KEYS.HOMEWORK, homeworkStore)
  setLocalJson(LS_KEYS.EXAMS, examResultsStore)
  setLocalJson(LS_KEYS.EXAMS_GENERAL, generalExamResultsStore)
}

/* ======================= Public API ======================= */
// Eşlemeleri dışa ver (read-only kopya)
export function getParentStudentMap(): Record<ParentId, StudentId[]> {
  return { ...parentStudentMap }
}
export function getTeacherClassMap(): Record<TeacherId, ClassId[]> {
  return { ...teacherClassMap }
}

// Setters (login/seed sonrası çağırılabilir)
export function setParentStudentMap(map: Record<ParentId, StudentId[]>) {
  parentStudentMap = map
  notificationService.setParentStudentMap(map)
  persistAll()
}
export function setTeacherClassMap(map: Record<TeacherId, ClassId[]>) {
  teacherClassMap = map
  persistAll()
}

/* ---- Sorgular ---- */
export function getStudentsByParentId(parentId: ParentId): StudentId[] {
  return parentStudentMap[parentId] || []
}

export function getClassesByTeacherId(teacherId: TeacherId): ClassId[] {
  return teacherClassMap[teacherId] || []
}

export function getHomeworksByClassId(classId: ClassId): Homework[] {
  return homeworkStore.filter((h) => h.classId === classId)
}

export function getExamResultsByStudentId(studentId: StudentId): ExamResult[] {
  return examResultsStore.filter((e) => e.studentId === studentId)
}

export function getGeneralExamResultsByClassId(classId: ClassId): GeneralExamResult[] {
  return generalExamResultsStore.filter((e) => e.classId === classId)
}

/* ---- Mutasyonlar ---- */
export function addHomework(hw: Homework, options?: { notify?: boolean }) {
  homeworkStore = [hw, ...homeworkStore]
  persistAll()

  if (options?.notify) {
    notificationService.createHomeworkNotification({
      homeworkId: hw.id,
      classId: hw.classId,
      className: hw.className,
      title: hw.title,
      dueDate: hw.dueDate,
      teacherName: undefined,
    })
  }
  // console.log("[store] Homework added. Total:", homeworkStore.length)
}

export function updateHomeworkSubmission(
  hwId: string,
  studentId: string,
  patch: Partial<HomeworkSubmission>
) {
  const idx = homeworkStore.findIndex((h) => h.id === hwId)
  if (idx === -1) return false

  const subIdx = homeworkStore[idx].submissions.findIndex((s) => s.studentId === studentId)
  if (subIdx === -1) return false

  const current = homeworkStore[idx].submissions[subIdx]
  homeworkStore[idx].submissions[subIdx] = { ...current, ...patch }
  persistAll()
  return true
}

export function addExamResult(exam: ExamResult, options?: { notify?: boolean }) {
  examResultsStore = [exam, ...examResultsStore]
  persistAll()

  if (options?.notify) {
    notificationService.createExamNotification({
      examId: exam.id,
      classId: exam.classId,
      className: exam.className,
      examTitle: exam.examTitle,
      studentId: exam.studentId,
      studentName: exam.studentName,
      score: exam.score,
      teacherName: undefined,
    })
  }
  // console.log("[store] Exam result added. Total:", examResultsStore.length)
}

export function addGeneralExamResult(exam: GeneralExamResult, options?: { notify?: boolean }) {
  generalExamResultsStore = [exam, ...generalExamResultsStore]
  persistAll()

  if (options?.notify) {
    notificationService.createExamNotification({
      examId: exam.id,
      classId: exam.classId,
      className: exam.className,
      examTitle: exam.examTitle,
      // genel sınav duyurusu → studentId yok
    })
  }
  // console.log("[store] General exam result added. Total:", generalExamResultsStore.length)
}

/* ---- Admin/Test yardımcıları ---- */
export function resetStoreToDefaults() {
  parentStudentMap = { ...DEFAULT_PARENT_STUDENT_MAP }
  teacherClassMap = { ...DEFAULT_TEACHER_CLASS_MAP }
  homeworkStore = [...DEFAULT_HOMEWORK]
  examResultsStore = [...DEFAULT_EXAM_RESULTS]
  generalExamResultsStore = [...DEFAULT_GENERAL_EXAM_RESULTS]
  notificationService.setParentStudentMap(parentStudentMap)
  persistAll()
}

export function getAllState() {
  return {
    parentStudentMap: getParentStudentMap(),
    teacherClassMap: getTeacherClassMap(),
    homeworkStore: [...homeworkStore],
    examResultsStore: [...examResultsStore],
    generalExamResultsStore: [...generalExamResultsStore],
  }
}
