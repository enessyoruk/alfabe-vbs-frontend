"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle, Clock, Search, Receipt } from "lucide-react"

// Mock payment data
const paymentData = [
  {
    id: "1",
    studentName: "Elif Yılmaz",
    studentId: "1",
    description: "Ocak Ayı Eğitim Ücreti",
    amount: 2500,
    dueDate: "2024-01-31",
    paidDate: "2024-01-15",
    status: "paid", // paid, pending, overdue
    paymentMethod: "Kredi Kartı",
    invoiceNumber: "INV-2024-001",
    category: "Eğitim Ücreti",
  },
  {
    id: "2",
    studentName: "Can Yılmaz",
    studentId: "2",
    description: "Ocak Ayı Eğitim Ücreti",
    amount: 2200,
    dueDate: "2024-01-31",
    paidDate: "2024-01-20",
    status: "paid",
    paymentMethod: "Banka Havalesi",
    invoiceNumber: "INV-2024-002",
    category: "Eğitim Ücreti",
  },
  {
    id: "3",
    studentName: "Elif Yılmaz",
    studentId: "1",
    description: "Şubat Ayı Eğitim Ücreti",
    amount: 2500,
    dueDate: "2024-02-28",
    paidDate: null,
    status: "pending",
    paymentMethod: null,
    invoiceNumber: "INV-2024-003",
    category: "Eğitim Ücreti",
  },
  {
    id: "4",
    studentName: "Can Yılmaz",
    studentId: "2",
    description: "Şubat Ayı Eğitim Ücreti",
    amount: 2200,
    dueDate: "2024-02-28",
    paidDate: null,
    status: "pending",
    paymentMethod: null,
    invoiceNumber: "INV-2024-004",
    category: "Eğitim Ücreti",
  },
  {
    id: "5",
    studentName: "Elif Yılmaz",
    studentId: "1",
    description: "Kitap ve Materyal Ücreti",
    amount: 450,
    dueDate: "2024-01-15",
    paidDate: null,
    status: "overdue",
    paymentMethod: null,
    invoiceNumber: "INV-2024-005",
    category: "Materyal",
  },
  {
    id: "6",
    studentName: "Can Yılmaz",
    studentId: "2",
    description: "Laboratuvar Ücreti",
    amount: 300,
    dueDate: "2024-01-20",
    paidDate: "2024-01-18",
    status: "paid",
    paymentMethod: "Nakit",
    invoiceNumber: "INV-2024-006",
    category: "Ek Ücret",
  },
]

// Mock children data
const children = [
  { id: "1", name: "Elif Yılmaz", class: "9-A Matematik" },
  { id: "2", name: "Can Yılmaz", class: "7-B Fen" },
]

export default function ParentPaymentsPage() {
  const [selectedStudent, setSelectedStudent] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPayments = paymentData.filter((payment) => {
    const matchesStudent = selectedStudent === "all" || payment.studentId === selectedStudent
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    const matchesSearch =
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.category.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStudent && matchesStatus && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ödendi</Badge>
      case "pending":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Bekliyor</Badge>
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Gecikti</Badge>
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-orange-600" />
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getPaymentStats = () => {
    const total = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const paid = filteredPayments.filter((p) => p.status === "paid").reduce((sum, payment) => sum + payment.amount, 0)
    const pending = filteredPayments
      .filter((p) => p.status === "pending")
      .reduce((sum, payment) => sum + payment.amount, 0)
    const overdue = filteredPayments
      .filter((p) => p.status === "overdue")
      .reduce((sum, payment) => sum + payment.amount, 0)
    return { total, paid, pending, overdue }
  }

  const stats = getPaymentStats()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount)
  }

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ödemeler</h1>
        <p className="text-muted-foreground">Eğitim ücretleri ve ödeme durumlarınızı takip edin</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam Tutar</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ödenen</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bekleyen</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.pending)}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Geciken</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Ödeme ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Öğrenci seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Çocuklar</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="pending">Bekleyen</SelectItem>
                <SelectItem value="paid">Ödenen</SelectItem>
                <SelectItem value="overdue">Geciken</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Ödeme Listesi
          </CardTitle>
          <CardDescription>Eğitim ücretleri ve ek ödemelerinizin detayları</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || selectedStudent !== "all" || statusFilter !== "all"
                  ? "Filtrelere uygun ödeme bulunamadı."
                  : "Henüz ödeme kaydı bulunmuyor."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => {
                const daysRemaining = getDaysRemaining(payment.dueDate)

                return (
                  <div
                    key={payment.id}
                    className="p-6 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{payment.description}</h3>
                          {getStatusBadge(payment.status)}
                          <Badge variant="outline" className="text-xs">
                            {payment.category}
                          </Badge>
                          {payment.status === "pending" && daysRemaining >= 0 && (
                            <Badge variant="outline" className="text-xs">
                              {daysRemaining === 0 ? "Bugün son gün" : `${daysRemaining} gün kaldı`}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="font-medium">{payment.studentName}</span>
                        </div>
                        <div className="text-lg font-bold text-foreground">{formatCurrency(payment.amount)}</div>
                      </div>
                      <div className="flex items-center gap-2">{getStatusIcon(payment.status)}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Son Ödeme Tarihi</p>
                        <p className="font-medium text-foreground">
                          {new Date(payment.dueDate).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ödeme Tarihi</p>
                        <p className="font-medium text-foreground">
                          {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString("tr-TR") : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ödeme Yöntemi</p>
                        <p className="font-medium text-foreground">{payment.paymentMethod || "-"}</p>
                      </div>
                    </div>

                    {payment.status === "overdue" && (
                      <div className="mt-4 p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800">
                          <AlertCircle className="h-4 w-4" />
                          <p className="font-medium">Ödeme Gecikti</p>
                        </div>
                        <p className="text-sm text-red-700 mt-1">
                          Bu ödemenin son tarihi geçmiştir. Lütfen en kısa sürede ödeme yapınız.
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
