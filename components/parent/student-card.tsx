"use client"

import Link from "next/link"
import { memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, BookOpen, FileText, User } from "lucide-react"

export interface StudentCardProps {
  id: string
  name: string
  classValue: string
  attendance: number
  pendingHomework: number
  photo?: string
}

function StudentCardComponent({
  id,
  name,
  classValue,
  attendance,
  pendingHomework,
  photo,
}: StudentCardProps) {
  const attendanceColor =
    attendance >= 90 ? "text-green-600" : "text-orange-600"

  const homeworkColor =
    pendingHomework > 0 ? "text-orange-600" : "text-green-600"

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">

        {/* Ana satır: Mobilde dikey, tablet & PC'de yatay */}
        <div className="flex flex-col sm:flex-row items-start gap-4">

          {/* FOTOĞRAF */}
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
            <AvatarImage
              src={photo || "/student-placeholder.png"}
              className="object-cover"
            />
            <AvatarFallback>
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>

          {/* SAĞ TARAF */}
          <div className="flex-1 w-full">

            {/* İSİM VE SINIF */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="font-semibold text-base">{name}</h3>
              <Badge variant="secondary">{classValue}</Badge>
            </div>

            {/* BİLGİLER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Devamsızlık:
                <span className={attendanceColor}>%{attendance}</span>
              </div>

              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Bekleyen:
                <span className={homeworkColor}>{pendingHomework} ödev</span>
              </div>
            </div>

            {/* BUTONLAR – Mobil alt alta, Tablet/PC yan yana */}
            <div className="flex flex-wrap gap-2 mt-4">

              <Link href={`/parent/attendance?student=${id}`} className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Calendar className="h-4 w-4 mr-1" />
                  Devamsızlık
                </Button>
              </Link>

              <Link href={`/parent/homework?student=${id}`} className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Ödevler
                </Button>
              </Link>

              <Link href={`/parent/exam-results?student=${id}`} className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <FileText className="h-4 w-4 mr-1" />
                  Sınavlar
                </Button>
              </Link>

            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const StudentCard = memo(StudentCardComponent)
