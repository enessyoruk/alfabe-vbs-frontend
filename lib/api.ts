// lib/api.ts

// Env yardımcı fonksiyon
function resolveApiBase(): string {
  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL

  if (!base || !base.trim()) {
    throw new Error(
      "API_BASE is not configured. Set NEXT_PUBLIC_API_BASE (veya eskiden kullanıyorsan NEXT_PUBLIC_API_URL) environment variable."
    )
  }

  return base.trim()
}

export const API_BASE = resolveApiBase()

type Json = Record<string, any> | any[]

// Güvenli JSON parse
async function readJson<T = any>(res: Response): Promise<T> {
  if (res.status === 204) return {} as T
  const text = await res.text()
  try {
    return (text ? JSON.parse(text) : {}) as T
  } catch {
    return {} as T
  }
}

function buildUrl(path: string): string {
  if (path.startsWith("/api/")) {
    // ⭐ Next.js API route — backend’e gitme
    return path
  }

  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`
}

function isFormData(body: any): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData
}

// -------------------------------------------------------
// 🔥 GLOBAL unauthorized handler (timeout | multi)
// -------------------------------------------------------
function handleUnauthorizedRedirect(reason?: "timeout" | "multi") {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem("vbs:user")
  } catch {}

  if (reason === "multi") {
    localStorage.setItem("vbs_logout_reason", "multi")
  } else if (reason === "timeout") {
    localStorage.setItem("vbs_logout_reason", "timeout")
  }

  document.cookie = "vbs_auth=; Max-Age=0; Path=/; SameSite=Lax"
  document.cookie = "vbs_role=; Max-Age=0; Path=/; SameSite=Lax"

  window.location.href = "/login"
}

// -------------------------------------------------------
// 🔥 Tek noktadan fetch wrapper
// -------------------------------------------------------
export async function apiFetch<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = buildUrl(path)

  const hasBody =
    typeof (init as any).body !== "undefined" &&
    (init as any).body !== null

  const bodyIsForm = hasBody && isFormData((init as any).body)

  const res = await fetch(url, {
    credentials: "include",
    mode: "cors",
    redirect: "follow",
    cache: "no-store",
    headers: {
      ...(hasBody && !bodyIsForm ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    ...init,
  })

  // -------------------------------------------------------
  // 🔥 401 — timeout & multi-login ayrımı
  // -------------------------------------------------------
  if (res.status === 401) {
    let reason: "timeout" | "multi" = "multi"

    try {
      const raw = localStorage.getItem("vbs:user")
      const obj = raw ? JSON.parse(raw) : null
      const exp = obj?.user?.sessionExpiresAt

      if (exp) {
        const expMs = new Date(exp).getTime()
        if (expMs < Date.now()) {
          reason = "timeout"
        }
      }
    } catch {}

    handleUnauthorizedRedirect(reason)
    throw new Error("Unauthorized")
  }

  // -------------------------------------------------------
  // 🔥 RATE LIMIT
  // -------------------------------------------------------
  if (res.status === 429) {
    const ra = res.headers.get("Retry-After")
    const wait = ra ? ` Lütfen ${ra} sn sonra tekrar deneyin.` : ""
    const data = await readJson<{ error?: string; message?: string }>(res)
    const msg = data?.error || data?.message || "Çok fazla deneme (429)."
    throw new Error(msg + wait)
  }

  // -------------------------------------------------------
  // 🔥 Diğer hatalar
  // -------------------------------------------------------
  if (!res.ok) {
    const data = await readJson<{ error?: string; message?: string }>(res)
    const msg = data?.error || data?.message || `API Error (HTTP ${res.status})`
    throw new Error(msg)
  }

  return readJson<T>(res)
}

export const backendFetch = apiFetch

// -------------------------------------------------------
// HTTP METHODS
// -------------------------------------------------------
export const http = {
  get: <T = any>(path: string, init?: RequestInit) =>
    apiFetch<T>(path, { method: "GET", ...(init || {}) }),

  post: <T = any>(path: string, body?: Json | FormData, init?: RequestInit) =>
    apiFetch<T>(path, {
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : body
          ? JSON.stringify(body)
          : undefined,
      ...(init || {}),
    }),

  put: <T = any>(path: string, body?: Json | FormData, init?: RequestInit) =>
    apiFetch<T>(path, {
      method: "PUT",
      body:
        body instanceof FormData
          ? body
          : body
          ? JSON.stringify(body)
          : undefined,
      ...(init || {}),
    }),

  patch: <T = any>(path: string, body?: Json | FormData, init?: RequestInit) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body:
        body instanceof FormData
          ? body
          : body
          ? JSON.stringify(body)
          : undefined,
      ...(init || {}),
    }),

  delete: <T = any>(path: string, init?: RequestInit) =>
    apiFetch<T>(path, { method: "DELETE", ...(init || {}) }),
}

// -------------------------------------------------------
// ENDPOINTS
// -------------------------------------------------------
const baseVbs = {
  auth: {
    login: "/api/vbs/auth/login",
    logout: "/api/vbs/auth/logout",
    checkEmail: "/api/vbs/auth/check-email",
    register: "/api/vbs/auth/register",
    ping: "/api/vbs/auth/ping",
  },

  parent: {
    students: "/api/parent/students",
    attendance: (studentId: string) =>
      `/api/parent/students/${studentId}/attendance`,
    payments: "/api/parent/payments",
    homework: (studentId: string) =>
      `/api/parent/students/${studentId}/homework`,
    examResults: (studentId: string) =>
      `/api/parent/students/${studentId}/exam-results`,
    examPhoto: (url: string) =>
      `/api/parent/exam-photo?url=${encodeURIComponent(url)}`,
  },

  teacher: {
    classes: "/api/teacher/classes",
    classStudents: (classId: string) =>
      `/api/teacher/classes/${classId}/students`,
    homework: "/api/vbs/teacher/homework",
    examResultsUpload: "/api/vbs/teacher/exam-results",
    analytics: "/api/vbs/teacher/dashboard-analytics",
    guidance: "/api/vbs/teacher/guidance",
    guidanceParentNote: "/api/vbs/teacher/guidance/parent-note",
    notifications: "/api/vbs/teacher/notifications",
    generalExams: "/api/vbs/teacher/exams/general",
    generalExamAnalysis: "/api/vbs/teacher/exams/analysis",
    totalStudents: "/api/vbs/teacher/total-students",
    exams: "/api/vbs/teacher/exams",
    examsUploadImage: "/api/vbs/teacher/exams/upload-image",
    examsDelete: "/api/vbs/teacher/exams/delete-exam",
  },
}

export const endpoints = {
  login: baseVbs.auth.login,
  logout: baseVbs.auth.logout,
  checkEmail: baseVbs.auth.checkEmail,
  register: baseVbs.auth.register,
  ping: baseVbs.auth.ping,

  parent: baseVbs.parent,
  teacher: baseVbs.teacher,

  vbs: baseVbs,
} as const
