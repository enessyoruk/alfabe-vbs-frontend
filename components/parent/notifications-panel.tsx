"use client"

import { memo } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, User, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Notification {
  id: string
  title: string
  message: string
  type: "holiday" | "announcement"
  date: string
}

interface Props {
  notifications: Notification[]
}

function NotificationsPanelComponent({ notifications }: Props) {
  const latest = [...notifications]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  return (
    <div className="space-y-6">

      {/* Üst bar - mobilde dikey, PC'de yatay */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Son Aktiviteler</h2>

        <Link href="/parent/notifications">
          <Button size="sm" variant="outline" className="whitespace-nowrap">

            Tümünü Gör
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Güncel Bildirimler</CardTitle>
          <CardDescription>Son eklenen duyuru ve tatiller</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">

          {latest.length === 0 ? (
            <Alert>
              <AlertDescription>Bildirim bulunamadı.</AlertDescription>
            </Alert>
          ) : (
            latest.map((n) => (
              <div
                key={n.id}
                className="
                  flex flex-col sm:flex-row 
                  items-start gap-3 
                  p-3 sm:p-4 
                  hover:bg-accent/40 
                  rounded-lg transition 
                  border border-border/60
                "
              >
                {/* ICON */}
                <div className="p-1.5 sm:p-2 bg-accent/30 rounded-full">
                  {n.type === "holiday" ? (
                    <Calendar className="h-4 w-4 text-green-600" />
                  ) : (
                    <User className="h-4 w-4 text-blue-600" />
                  )}
                </div>

                {/* TEXT */}
<div className="flex-1 min-w-0">
  
  <p className="font-medium break-words whitespace-normal">
    {n.title}
  </p>

  
  <p className="text-xs text-muted-foreground whitespace-normal mt-0.5 break-words">
    {n.message}
  </p>

  {/* Tarih */}
  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
    <Clock className="h-3 w-3" />
    {new Date(n.date).toLocaleDateString("tr-TR")}
  </p>
</div>

              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const NotificationsPanel = memo(NotificationsPanelComponent)
