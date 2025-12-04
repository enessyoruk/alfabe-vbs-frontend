"use client"

import { memo, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { User, BookOpen, Calendar } from "lucide-react"

interface Props {
  students: {
    attendance: number
    pendingHomework: number
  }[]
}

function QuickStatsComponent({ students }: Props) {
  const stats = useMemo(() => {
    const totalStudents = students.length
    const totalHomework = students.reduce((a, s) => a + s.pendingHomework, 0)
    const avgAttendance =
      totalStudents > 0
        ? Math.round(
            students.reduce((a, s) => a + s.attendance, 0) / totalStudents
          )
        : 0

    return [
      {
        title: "Toplam Öğrenci",
        value: totalStudents,
        icon: User,
        color: "text-primary",
        bg: "bg-primary/10",
      },
      {
        title: "Bekleyen Ödev",
        value: totalHomework,
        icon: BookOpen,
        color: "text-orange-600",
        bg: "bg-orange-100",
      },
      {
        title: "Ortalama Devam Oranı",
        value: `${avgAttendance}%`,
        icon: Calendar,
        color: "text-red-600",
        bg: "bg-red-100",
      },
    ]
  }, [students])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.title}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
              <div className={`p-3 rounded-full ${s.bg}`}>
                <s.icon className={`h-6 w-6 ${s.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export const QuickStats = memo(QuickStatsComponent)
