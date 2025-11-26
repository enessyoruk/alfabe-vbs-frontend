"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar, Send, MessageSquare, Phone, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Holiday {
  id: string
  name: string
  date: string
  type: string
  description: string
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [selectedHoliday, setSelectedHoliday] = useState<string>("")
  const [message, setMessage] = useState("")
  const [sendSMS, setSendSMS] = useState(true)
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // basit runtime istatistikleri (bu oturum için)
  const [totalNotificationsSent, setTotalNotificationsSent] = useState(0)
  const [totalSmsSent, setTotalSmsSent] = useState(0)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  useEffect(() => {
    fetchHolidays()
  }, [])

  const fetchHolidays = async () => {
    try {
      setListLoading(true)
      setError(null)

      const response = await fetch("/api/holidays", { credentials: "include" })
      const data = await response.json()

      // Beklenen: { success: boolean, holidays: Holiday[] }
      if (data?.success && Array.isArray(data.holidays)) {
        setHolidays(data.holidays)
      } else if (Array.isArray(data)) {
        // alternatif: direkt liste dönerse
        setHolidays(data)
      } else {
        console.warn("[v0] /api/holidays beklenmeyen cevap:", data)
        setHolidays([])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch holidays:", error)
      setError("Tatil listesi yüklenirken bir hata oluştu.")
    } finally {
      setListLoading(false)
    }
  }

  const sendHolidayNotification = async () => {
    if (!selectedHoliday || !message.trim()) {
      alert("Lütfen tatil seçin ve mesaj yazın")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/holidays", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          holidayId: selectedHoliday,
          message: message,
          sendSMS: sendSMS,
        }),
      })

      const data = await response.json()
      if (data?.success) {
        const notificationsSent = Number(data.notificationsSent ?? 0)
        const smsSent = Number(data.smsSent ?? 0)

        setTotalNotificationsSent((prev) => prev + notificationsSent)
        setTotalSmsSent((prev) => prev + smsSent)

        alert(
          `Tatil bildirimi başarıyla gönderildi! ${notificationsSent} bildirim, ${smsSent} SMS gönderildi.`,
        )
        setMessage("")
        setSelectedHoliday("")
      } else {
        console.error("[v0] Holiday notification failed:", data)
        alert("Bildirim gönderilirken hata oluştu")
      }
    } catch (error) {
      console.error("[v0] Failed to send holiday notification:", error)
      alert("Bildirim gönderilirken hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(holidays.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentHolidays = holidays.slice(startIndex, endIndex)

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/teacher/dashboard" className="text-blue-600 hover:underline">
          Ana Panel
        </Link>
        <span className="text-gray-500">/</span>
        <Link href="/teacher/holidays" className="text-blue-600 hover:underline">
          Tatil Bildirimleri
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Tatil Bildirimleri</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holiday List */}
        <Card>
          <CardHeader>
            <CardTitle>Tatil Günleri</CardTitle>
            <CardDescription>Velilere bildirim gönderilecek tatil günlerini seçin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {listLoading && <p className="text-sm text-gray-500">Tatil günleri yükleniyor…</p>}
            {error && !listLoading && (
              <p className="text-sm text-red-600 mb-2">{error}</p>
            )}
            {!listLoading && !error && holidays.length === 0 && (
              <p className="text-sm text-gray-500">Bu yıl için tanımlı tatil bulunamadı.</p>
            )}

            {currentHolidays.map((holiday) => (
              <div
                key={holiday.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedHoliday === holiday.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedHoliday(holiday.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{holiday.name}</h3>
                    <p className="text-sm text-gray-600">{holiday.description}</p>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {new Date(holiday.date).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </div>
            ))}

            {totalPages > 1 && holidays.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Önceki
                </Button>
                <span className="text-sm text-gray-600">
                  Sayfa {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Sonraki
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Form */}
        <Card>
          <CardHeader>
            <CardTitle>Bildirim Gönder</CardTitle>
            <CardDescription>Velilere tatil bildirimi ve SMS gönderin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bildirim Mesajı</label>
              <Textarea
                placeholder="Tatil bildirimi mesajınızı yazın..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm font-medium">SMS Gönder</span>
              </div>
              <Switch checked={sendSMS} onCheckedChange={setSendSMS} />
            </div>

            <Button
              onClick={sendHolidayNotification}
              disabled={loading || !selectedHoliday || !message.trim()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Gönderiliyor..." : "Bildirim Gönder"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Bildirim İstatistikleri</CardTitle>
          <CardDescription>
            Şu an için bu sayfayı kullandığınız oturumdaki gönderim özetiniz.
            (İleride backend toplam istatistiklerine bağlanacağız.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">
                {totalNotificationsSent}
              </div>
              <div className="text-sm text-gray-600">Gönderilen Bildirim</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Phone className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {totalSmsSent}
              </div>
              <div className="text-sm text-gray-600">Gönderilen SMS</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">{holidays.length}</div>
              <div className="text-sm text-gray-600">Bu Yıl Tatil</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
