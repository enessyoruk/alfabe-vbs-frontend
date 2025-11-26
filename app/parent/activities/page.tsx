"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, FileText, CreditCard, Calendar, Clock } from "lucide-react"

const allActivities = [
  {
    type: "homework",
    title: "Matematik ödevi teslim edildi",
    student: "Elif Yılmaz",
    time: "2 saat önce",
    icon: BookOpen,
    color: "text-green-600",
    status: "completed",
  },
  {
    type: "exam",
    title: "Fen Bilgisi sınav sonucu yüklendi",
    student: "Can Yılmaz",
    time: "1 gün önce",
    icon: FileText,
    color: "text-blue-600",
    status: "new",
  },
  {
    type: "payment",
    title: "Ocak ayı ödemesi alındı",
    student: "Genel",
    time: "3 gün önce",
    icon: CreditCard,
    color: "text-green-600",
    status: "completed",
  },
  {
    type: "attendance",
    title: "Devamsızlık kaydı eklendi",
    student: "Elif Yılmaz",
    time: "1 hafta önce",
    icon: Calendar,
    color: "text-orange-600",
    status: "warning",
  },
  {
    type: "homework",
    title: "Türkçe ödevi teslim edildi",
    student: "Can Yılmaz",
    time: "1 hafta önce",
    icon: BookOpen,
    color: "text-green-600",
    status: "completed",
  },
  {
    type: "exam",
    title: "Matematik sınav sonucu yüklendi",
    student: "Elif Yılmaz",
    time: "2 hafta önce",
    icon: FileText,
    color: "text-blue-600",
    status: "new",
  },
]

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Tüm Aktiviteler</h1>
        <p className="text-muted-foreground">Çocuklarınızın tüm aktivitelerini buradan takip edebilirsiniz.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
          <CardDescription>Kronolojik sırayla tüm aktiviteler</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allActivities.map((activity, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <div className={`p-2 rounded-full bg-accent/20`}>
                <activity.icon className={`h-4 w-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <Badge
                    variant={
                      activity.status === "new"
                        ? "default"
                        : activity.status === "warning"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {activity.status === "new" ? "Yeni" : activity.status === "warning" ? "Dikkat" : "Tamamlandı"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{activity.student}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
