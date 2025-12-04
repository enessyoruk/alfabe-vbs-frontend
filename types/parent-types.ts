// /types/parent-types.ts

export type VbsUser = {
  id: string
  name?: string
  email?: string
  roles?: string[]
}

export type ApiStudent = {
  id: number | string
  name?: string
  fullName?: string
  class?: string
  className?: string
  branch?: string
  photo?: string
  attendance?: number
  pendingHomework?: number
  lastExam?: string
}

export type UiStudent = {
  id: string
  name: string
  class: string
  branch?: string
  photo?: string
  attendance: number
  pendingHomework: number
  lastExam?: string
}

export type ApiNotification = {
  id: string | number
  title: string
  message: string
  type?: string
  date: string
}

export type UiNotification = {
  id: string
  title: string
  message: string
  type: "holiday" | "announcement"
  date: string
}
