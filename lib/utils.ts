import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isBrowser = typeof window !== "undefined" && typeof document !== "undefined"

export function safeParseJson<T = any>(text: string, fallback: T = {} as T): T {
  try {
    return text ? (JSON.parse(text) as T) : fallback
  } catch {
    return fallback
  }
}

export function setLocalJson(key: string, value: unknown) {
  if (!isBrowser) return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function getLocalJson<T = any>(key: string, fallback: T | null = null): T | null {
  if (!isBrowser) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function clearLocal(key: string) {
  if (!isBrowser) return
  try {
    localStorage.removeItem(key)
  } catch {}
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function formatDateTR(d: string | number | Date, withTime = false) {
  const date = d instanceof Date ? d : new Date(d)
  return date.toLocaleString("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

export function joinUrl(base: string, path: string) {
  if (!base) return path
  if (!path) return base
  const b = base.endsWith("/") ? base.slice(0, -1) : base
  const p = path.startsWith("/") ? path : `/${path}`
  return `${b}${p}`
}

export function hasAnyRole(roles: string[] | undefined | null, allowed: string[]) {
  if (!roles || roles.length === 0) return false
  return roles.some((r) => allowed.includes(r))
}

export function noop() {
}
