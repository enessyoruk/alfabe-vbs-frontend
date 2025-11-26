"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Edit, Trash2 } from "lucide-react"

export default function HomeworkDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [homework, setHomework] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHomeworkDetails = async () => {
      try {
        const response = await fetch(`/api/homework/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          setHomework(data.homework)
        }
      } catch (error) {
        console.error("Failed to fetch homework details:", error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchHomeworkDetails()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!homework) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Ödev bulunamadı.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Ödev Detayları</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button variant="outline" className="text-red-600 hover:text-red-700 bg-transparent">
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {homework.title}
          </CardTitle>
          <CardDescription>{homework.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sınıf</p>
              <p className="text-foreground">{homework.class}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Verilme Tarihi</p>
              <p className="text-foreground">{new Date(homework.assignedDate).toLocaleDateString("tr-TR")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Teslim Tarihi</p>
              <p className="text-foreground">{new Date(homework.dueDate).toLocaleDateString("tr-TR")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
