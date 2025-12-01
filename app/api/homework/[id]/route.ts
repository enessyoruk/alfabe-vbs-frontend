import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Mock homework data (same as main route)
const mockHomework = [
  {
    id: "1",
    teacherId: "1",
    classId: "1",
    className: "9-A Matematik",
    title: "Fonksiyonlar Konu Tekrarı",
    description: "Sayfa 45-50 arası sorular çözülecek. Grafik çizimi ve fonksiyon tanımları üzerinde durulacak.",
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
  {
    id: "2",
    teacherId: "1",
    classId: "2",
    className: "10-B Matematik",
    title: "Türev Uygulamaları",
    description: "Türev konusu uygulama soruları. Sayfa 78-85 arası problemler çözülecek.",
    subject: "Matematik",
    assignedDate: "2024-01-12",
    dueDate: "2024-01-22",
    status: "active",
    submissions: [],
  },
]

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("authToken")?.value
    if (!token) {
      return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const homework = mockHomework.find((hw) => hw.id === params.id)

    if (!homework) {
      return NextResponse.json({ error: "Ödev bulunamadı" }, { status: 404 })
    }

    // Check authorization
    if (decoded.userType === "teacher" && homework.teacherId !== decoded.userId) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      homework,
    })
  } catch (error) {
    console.error("Homework details API error:", error)
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 })
  }
}
