import { NextResponse } from "next/server"

// Mock database for pending registrations
const pendingRegistrations = [
  {
    id: "1",
    name: "Ahmet Yılmaz",
    phone: "5551234567",
    userType: "parent",
    status: "pending",
    createdAt: new Date().toISOString(),
    children: ["Mehmet Yılmaz - 5. Sınıf"],
  },
  {
    id: "2",
    name: "Fatma Demir",
    phone: "5559876543",
    userType: "teacher",
    status: "pending",
    createdAt: new Date().toISOString(),
    subject: "Matematik",
  },
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      registrations: pendingRegistrations,
    })
  } catch (error) {
    return NextResponse.json({ error: "Kayıtlar alınamadı" }, { status: 500 })
  }
}
