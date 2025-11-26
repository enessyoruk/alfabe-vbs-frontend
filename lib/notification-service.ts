// lib/notification-service.ts
// Merkezî Bildirim Servisi (frontend)
// - Hafızada tutar + localStorage’a yazar (sayfa yenilenince kaybolmasın)
// - İleride backend’e taşınması kolay (tek noktadan değişecek)
// - Basit gözlemci (subscribe) ile UI otomatik güncellenebilir

import { getLocalJson, setLocalJson, clearLocal, formatDateTR } from "@/lib/utils"

/* ======================= Türler ======================= */
export type NotificationType =
  | "homework"
  | "exam"
  | "grade"
  | "announcement"
  | "holiday"
  | "event"
  | "warning"

export interface Notification {
  id: string
  userId: string            // Bildirimi alacak veli ID'si
  studentId?: string        // İlgili öğrenci
  title: string
  message: string
  type: NotificationType
  date: string              // ISO string
  isRead: boolean
  metadata?: {
    homeworkId?: string
    examId?: string
    classId?: string
    className?: string
    teacherName?: string
    score?: number
  }
}

/* ======================= Kalıcı Depo ======================= */
const LS_KEY = "vbs:notifications"
const LS_PARENT_MAP_KEY = "vbs:parent-students"

// Varsayılan parent-öğrenci eşleşmesi (örnek)
const defaultParentStudentMap: Record<string, string[]> = {
  "1": ["1", "2"], // Parent 1 → Student 1 & 2
}

function loadStore(): Notification[] {
  return getLocalJson<Notification[]>(LS_KEY, []) || []
}
function saveStore(list: Notification[]) {
  setLocalJson(LS_KEY, list)
}

// Parent-Student eşleşmesini de saklayalım (ileride backend'den gelebilir)
function loadParentMap(): Record<string, string[]> {
  return getLocalJson<Record<string, string[]>>(LS_PARENT_MAP_KEY, defaultParentStudentMap) || defaultParentStudentMap
}
function saveParentMap(map: Record<string, string[]>) {
  setLocalJson(LS_PARENT_MAP_KEY, map)
}

/* ======================= Gözlemci (Observer) ======================= */
type Listener = (items: Notification[]) => void
const listeners = new Set<Listener>()
function notify(list: Notification[]) {
  for (const fn of listeners) fn(list)
}
export function subscribe(fn: Listener) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/* ======================= Yardımcılar ======================= */
function nowIso() { return new Date().toISOString() }
function newid(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }

/* ======================= Servis ======================= */
let store = loadStore()
let parentStudentMap = loadParentMap()

export const notificationService = {
  /* -------- Admin/seed yardımcıları -------- */
  /** Parent-Student eşleşmesini güncelle (ör. login sonrasında) */
  setParentStudentMap(map: Record<string, string[]>) {
    parentStudentMap = map
    saveParentMap(map)
  },

  /** Tüm bildirimi temizle (test için) */
  clearAll() {
    store = []
    saveStore(store)
    notify(store)
  },

  /* -------- Oluşturucular -------- */
  createHomeworkNotification: (data: {
    homeworkId: string
    classId: string
    className: string
    title: string
    dueDate: string | Date
    teacherName?: string
  }) => {
    // Şimdilik sınıf filtresi yapmıyoruz → bağlı tüm velilere gönder
    const affectedParents = Object.entries(parentStudentMap)

    const created: Notification[] = affectedParents.map(([parentId, studentIds]) => ({
      id: newid("hw"),
      userId: parentId,
      studentId: studentIds?.[0],
      title: "Yeni Ödev Atandı",
      message: `${data.className} sınıfı için “${data.title}” ödevi verildi. Son teslim: ${formatDateTR(data.dueDate, false)}`,
      type: "homework",
      date: nowIso(),
      isRead: false,
      metadata: {
        homeworkId: data.homeworkId,
        classId: data.classId,
        className: data.className,
        teacherName: data.teacherName,
      },
    }))

    store = [...created, ...store]
    saveStore(store)
    notify(store)
    return { success: true, notificationsCreated: created.length }
  },

  createExamNotification: (data: {
    examId: string
    classId: string
    className: string
    examTitle: string
    studentId?: string
    studentName?: string
    score?: number
    teacherName?: string
  }) => {
    // Öğrenciye özel sonuç yüklendiyse tek veliye; değilse sınıfın tüm velilerine
    if (data.studentId) {
      const parentId = Object.entries(parentStudentMap).find(([, list]) => list.includes(data.studentId!))?.[0]
      if (!parentId) return { success: false, notificationsCreated: 0 }

      const ntf: Notification = {
        id: newid("exam"),
        userId: parentId,
        studentId: data.studentId,
        title: "Sınav Sonucu Yüklendi",
        message: `${data.studentName || "Öğrenci"} için “${data.examTitle}” sınav sonucu yüklendi${typeof data.score === "number" ? ` (Not: ${data.score}/100)` : ""}.`,
        type: "exam",
        date: nowIso(),
        isRead: false,
        metadata: {
          examId: data.examId,
          classId: data.classId,
          className: data.className,
          teacherName: data.teacherName,
          score: data.score,
        },
      }
      store = [ntf, ...store]
      saveStore(store)
      notify(store)
      return { success: true, notificationsCreated: 1 }
    }

    // Genel duyuru: sınıfın tüm velileri (şimdilik tüm veliler)
    const affectedParents = Object.entries(parentStudentMap)
    const created: Notification[] = affectedParents.map(([parentId, studentIds]) => ({
      id: newid("exam"),
      userId: parentId,
      studentId: studentIds?.[0],
      title: "Sınav Sonuçları Yayınlandı",
      message: `${data.className} sınıfı “${data.examTitle}” sınav sonuçları yayınlandı.`,
      type: "exam",
      date: nowIso(),
      isRead: false,
      metadata: {
        examId: data.examId,
        classId: data.classId,
        className: data.className,
        teacherName: data.teacherName,
      },
    }))
    store = [...created, ...store]
    saveStore(store)
    notify(store)
    return { success: true, notificationsCreated: created.length }
  },

  createGuidanceNotification: (data: {
    studentId: string
    studentName: string
    area: string
    content: string
    teacherName?: string
  }) => {
    const parentId = Object.entries(parentStudentMap).find(([, list]) => list.includes(data.studentId))?.[0]
    if (!parentId) return { success: false, notificationsCreated: 0 }

    const ntf: Notification = {
      id: newid("guidance"),
      userId: parentId,
      studentId: data.studentId,
      title: "Yeni Rehberlik Notu",
      message: `${data.studentName} için “${data.area}” konusunda rehberlik notu eklendi.`,
      // Tip tartışmalı olabilir; mevcut ekranlar "grade"e bakıyorsa bozmayalım:
      type: "grade",
      date: nowIso(),
      isRead: false,
      metadata: { teacherName: data.teacherName },
    }
    store = [ntf, ...store]
    saveStore(store)
    notify(store)
    return { success: true, notificationsCreated: 1 }
  },

  createAnnouncement: (data: {
    title: string
    message: string
    kind?: Extract<NotificationType, "announcement" | "event" | "holiday" | "warning">
  }) => {
    const affectedParents = Object.keys(parentStudentMap)
    const created: Notification[] = affectedParents.map((parentId) => ({
      id: newid(data.kind || "announcement"),
      userId: parentId,
      title: data.title,
      message: data.message,
      type: data.kind || "announcement",
      date: nowIso(),
      isRead: false,
    }))
    store = [...created, ...store]
    saveStore(store)
    notify(store)
    return { success: true, notificationsCreated: created.length }
  },

  /* -------- Okuma & Güncelleme -------- */
  getNotifications(userId: string): Notification[] {
    return store
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  getByType(userId: string, types: NotificationType[]): Notification[] {
    const set = new Set(types)
    return store
      .filter((n) => n.userId === userId && set.has(n.type))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },

  markAsRead(notificationId: string): boolean {
    const idx = store.findIndex((n) => n.id === notificationId)
    if (idx === -1) return false
    if (!store[idx].isRead) {
      store[idx] = { ...store[idx], isRead: true }
      saveStore(store)
      notify(store)
    }
    return true
  },

  markAllAsRead(userId: string): number {
    let updated = 0
    store = store.map((n) => {
      if (n.userId === userId && !n.isRead) { updated++; return { ...n, isRead: true } }
      return n
    })
    if (updated > 0) {
      saveStore(store)
      notify(store)
    }
    return updated
  },

  getUnreadCount(userId: string): number {
    return store.filter((n) => n.userId === userId && !n.isRead).length
  },
}
