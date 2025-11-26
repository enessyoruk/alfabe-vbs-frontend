import { type NextRequest, NextResponse } from "next/server"

// This would be imported from a shared location in a real app
const pendingRegistrations = new Map<
  string,
  {
    id: string
    name: string
    phone: string
    email: string
    password: string
    userType: "parent" | "teacher"
    status: "pending" | "approved" | "rejected"
    createdAt: Date
    approvedAt?: Date
    rejectedAt?: Date
    adminNotes?: string
  }
>()

// Mock approved users storage (this would be the main users table in production)
const approvedUsers = new Map<
  string,
  {
    id: string
    name: string
    phone: string
    email: string
    password: string
    type: "parent" | "teacher"
    createdAt: Date
  }
>()

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { action, adminNotes } = body

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 })
    }

    const registration = pendingRegistrations.get(id)
    if (!registration) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 })
    }

    if (registration.status !== "pending") {
      return NextResponse.json({ error: "Bu kayıt zaten işlenmiş" }, { status: 400 })
    }

    if (action === "approve") {
      // Move to approved users
      const approvedUser = {
        id: registration.id,
        name: registration.name,
        phone: registration.phone,
        email: registration.email,
        password: registration.password,
        type: registration.userType,
        createdAt: new Date(),
      }

      approvedUsers.set(registration.id, approvedUser)

      // Update registration status
      registration.status = "approved"
      registration.approvedAt = new Date()
      registration.adminNotes = adminNotes

      console.log("[v0] Registration approved:", {
        id: registration.id,
        name: registration.name,
        userType: registration.userType,
      })

      return NextResponse.json({
        success: true,
        message: "Kayıt onaylandı",
        registration: { ...registration, password: undefined },
      })
    } else if (action === "reject") {
      registration.status = "rejected"
      registration.rejectedAt = new Date()
      registration.adminNotes = adminNotes

      console.log("[v0] Registration rejected:", {
        id: registration.id,
        name: registration.name,
        reason: adminNotes,
      })

      return NextResponse.json({
        success: true,
        message: "Kayıt reddedildi",
        registration: { ...registration, password: undefined },
      })
    }
  } catch (error) {
    console.error("[v0] Registration approval API error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
