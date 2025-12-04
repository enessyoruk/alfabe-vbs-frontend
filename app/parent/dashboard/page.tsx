"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { StudentCard } from "@/components/parent/student-card"
import { NotificationsPanel } from "@/components/parent/notifications-panel"
import { QuickStats } from "@/components/parent/quick-stats"
import { WelcomeHeader } from "@/components/parent/welcome-header"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

import type {
  ApiStudent,
  ApiNotification,
  UiStudent,
  UiNotification,
  VbsUser,
} from "@/types/parent-types"

/* ============================================================= */
/* ========================= HELPERS =========================== */
/* ============================================================= */

const parseStoredUser = (raw: string | null): VbsUser | null => {
  if (!raw) return null
  try {
    const v = JSON.parse(raw)
    return (v.user ?? v) as VbsUser
  } catch {
    return null
  }
}

/* ============================================================= */
/* ======================= MAIN PAGE =========================== */
/* ============================================================= */

export default function ParentDashboardPage() {
  const router = useRouter()

  const [user, setUser] = useState<VbsUser | null>(null)
  const [students, setStudents] = useState<UiStudent[]>([])
  const [notifications, setNotifications] = useState<UiNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ------------------- AUTH GUARD -------------------- */
  useEffect(() => {
    const raw = localStorage.getItem("vbs:user")
    const u = parseStoredUser(raw)
    const roles = Array.isArray(u?.roles) ? u.roles : []

    if (!u || !roles.includes("Parent")) {
      router.replace("/login")
      return
    }

    setUser(u)
  }, [router])

  /* ---------------- NORMALIZERS (FAST) ---------------- */
  const normalizeStudent = useCallback((x: ApiStudent): UiStudent => {
    return {
      id: String(x.id ?? ""),
      name: String(x.name ?? x.fullName ?? "Öğrenci"),
      class: String(x.class ?? x.className ?? "-"),
      branch: x.branch,
      photo: x.photo,
      attendance: typeof x.attendance === "number" ? x.attendance : 0,
      pendingHomework:
        typeof x.pendingHomework === "number" ? x.pendingHomework : 0,
      lastExam: x.lastExam,
    }
  }, [])

  const normalizeNotification = useCallback(
    (n: ApiNotification): UiNotification => {
      return {
        id: String(n.id),
        title: n.title,
        message: n.message,
        type: n.type === "holiday" ? "holiday" : "announcement",
        date: n.date,
      }
    },
    []
  )

  /* ------------------ FETCH DATA ---------------------- */
  useEffect(() => {
    if (!user) return

    const ac = new AbortController()

    ;(async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [sRes, nRes] = await Promise.all([
          fetch(`/api/parent/students`, {
            credentials: "include",
            signal: ac.signal,
          }),
          fetch(`/api/parent/notifications`, {
            credentials: "include",
            signal: ac.signal,
          }),
        ])

        if (sRes.status === 401) {
          toast.error("Oturum süreniz sona erdi. Lütfen tekrar giriş yapın.")
          router.replace("/login")
          return
        }

        const sJson = await sRes.json()
        const nJson = nRes.ok ? await nRes.json() : { items: [] }

        const sArr: ApiStudent[] =
          Array.isArray(sJson.items)
            ? sJson.items
            : Array.isArray(sJson)
            ? sJson
            : []

        const nArr: ApiNotification[] =
          Array.isArray(nJson.items)
            ? nJson.items
            : Array.isArray(nJson)
            ? nJson
            : []

        setStudents(sArr.map(normalizeStudent))
        setNotifications(nArr.map(normalizeNotification))
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          toast.error("Veriler yüklenirken bir hata oluştu!")
          setError("Veriler yüklenirken bir hata oluştu.")
        }
      } finally {
        setIsLoading(false)
      }
    })()

    return () => ac.abort()
  }, [user, router, normalizeStudent, normalizeNotification])

  /* ----------------- LOADING SCREEN ------------------- */
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm z-50">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">
          Anasayfa yükleniyor...
        </p>
      </div>
    )
  }

  /* ============================================================= */
  /* ========================== UI =============================== */
  /* ============================================================= */

  return (
    <div className="space-y-6">

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ===================== WELCOME ===================== */}
      <WelcomeHeader user={user} />

      {/* ==================== QUICK STATS ================== */}
      <QuickStats students={students} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ================== STUDENTS ================== */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Öğrencilerim</h2>

          {students.length === 0 ? (
            <Alert>
              <AlertDescription>Öğrenci verisi bulunamadı.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {students.map((st) => (
                <StudentCard
                  key={st.id}
                  id={st.id}
                  name={st.name}
                  classValue={st.class}
                  attendance={st.attendance}
                  pendingHomework={st.pendingHomework}
                  photo={st.photo}
                />
              ))}
            </div>
          )}
        </div>

        {/* ================= NOTIFICATIONS ================ */}
        <NotificationsPanel notifications={notifications} />
      </div>
    </div>
  )
}
