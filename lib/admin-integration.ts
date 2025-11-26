/**
 * Admin Panel Entegrasyon Yardımcı Fonksiyonları
 *
 * Bu dosya, mevcut okul yönetim sistemi ile admin panel arasındaki
 * entegrasyonu kolaylaştırmak için yardımcı fonksiyonlar içerir.
 */

// Admin panel için API client
export class AdminAPIClient {
  private baseUrl: string
  private adminToken: string

  constructor(baseUrl: string, adminToken: string) {
    this.baseUrl = baseUrl
    this.adminToken = adminToken
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      Authorization: `Bearer ${this.adminToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error (${response.status}): ${error}`)
    }

    return await response.json()
  }

  // Kullanıcı yönetimi
  async getUsers() {
    return this.request("/api/admin/users")
  }

  async createUser(userData: any) {
    return this.request("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async updateUser(userId: string, userData: any) {
    return this.request(`/api/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(userId: string) {
    return this.request(`/api/admin/users/${userId}`, {
      method: "DELETE",
    })
  }

  // Kayıt istekleri yönetimi
  async getRegistrations() {
    return this.request("/api/admin/registrations")
  }

  async approveRegistration(registrationId: string) {
    return this.request(`/api/admin/registrations/${registrationId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "approved" }),
    })
  }

  async rejectRegistration(registrationId: string) {
    return this.request(`/api/admin/registrations/${registrationId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "rejected" }),
    })
  }

  // Sınıf yönetimi
  async getClasses() {
    return this.request("/api/admin/classes")
  }

  async createClass(classData: any) {
    return this.request("/api/admin/classes", {
      method: "POST",
      body: JSON.stringify(classData),
    })
  }

  // Öğrenci yönetimi
  async getStudents(classId?: string) {
    const query = classId ? `?classId=${classId}` : ""
    return this.request(`/api/admin/students${query}`)
  }

  async createStudent(studentData: any) {
    return this.request("/api/admin/students", {
      method: "POST",
      body: JSON.stringify(studentData),
    })
  }

  // Raporlama
  async getSystemStats() {
    return this.request("/api/admin/stats")
  }

  async generateReport(reportType: string, params: any) {
    return this.request("/api/admin/reports", {
      method: "POST",
      body: JSON.stringify({ type: reportType, ...params }),
    })
  }
}

// Webhook handler
export class WebhookHandler {
  private webhookUrl: string
  private secret: string

  constructor(webhookUrl: string, secret: string) {
    this.webhookUrl = webhookUrl
    this.secret = secret
  }

  async sendEvent(event: string, data: any) {
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      signature: this.generateSignature(event, data),
    }

    const response = await fetch(this.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": this.secret,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error("[v0] Webhook failed:", await response.text())
      throw new Error(`Webhook failed: ${response.status}`)
    }

    return await response.json()
  }

  private generateSignature(event: string, data: any): string {
    // Basit signature oluşturma (production'da HMAC kullanılmalı)
    const payload = JSON.stringify({ event, data })
    return Buffer.from(`${this.secret}:${payload}`).toString("base64")
  }

  // Webhook olayları
  async notifyUserCreated(user: any) {
    return this.sendEvent("user.created", user)
  }

  async notifyExamUploaded(exam: any) {
    return this.sendEvent("exam.uploaded", exam)
  }

  async notifyPaymentReceived(payment: any) {
    return this.sendEvent("payment.received", payment)
  }

  async notifyStudentRegistered(student: any) {
    return this.sendEvent("student.registered", student)
  }
}

// Toplu işlemler için yardımcı fonksiyonlar
export class BulkOperations {
  private apiClient: AdminAPIClient

  constructor(apiClient: AdminAPIClient) {
    this.apiClient = apiClient
  }

  async bulkCreateUsers(users: any[]) {
    const results = []
    for (const user of users) {
      try {
        const result = await this.apiClient.createUser(user)
        results.push({ success: true, user: result })
      } catch (error) {
        results.push({ success: false, user, error: (error as Error).message })
      }
    }
    return results
  }

  async bulkCreateStudents(students: any[]) {
    const results = []
    for (const student of students) {
      try {
        const result = await this.apiClient.createStudent(student)
        results.push({ success: true, student: result })
      } catch (error) {
        results.push({ success: false, student, error: (error as Error).message })
      }
    }
    return results
  }
}

// Veri senkronizasyonu
export class DataSync {
  private sourceAPI: AdminAPIClient
  private targetAPI: AdminAPIClient

  constructor(sourceAPI: AdminAPIClient, targetAPI: AdminAPIClient) {
    this.sourceAPI = sourceAPI
    this.targetAPI = targetAPI
  }

  async syncUsers() {
    console.log("[v0] Syncing users...")
    const sourceUsers = await this.sourceAPI.getUsers()
    const targetUsers = await this.targetAPI.getUsers()

    const sourceUserIds = new Set(sourceUsers.map((u: any) => u.id))
    const targetUserIds = new Set(targetUsers.map((u: any) => u.id))

    // Yeni kullanıcıları ekle
    const newUsers = sourceUsers.filter((u: any) => !targetUserIds.has(u.id))
    for (const user of newUsers) {
      await this.targetAPI.createUser(user)
    }

    console.log(`[v0] Synced ${newUsers.length} new users`)
    return { synced: newUsers.length }
  }

  async syncClasses() {
    console.log("[v0] Syncing classes...")
    const sourceClasses = await this.sourceAPI.getClasses()
    const targetClasses = await this.targetAPI.getClasses()

    const sourceClassIds = new Set(sourceClasses.map((c: any) => c.id))
    const targetClassIds = new Set(targetClasses.map((c: any) => c.id))

    const newClasses = sourceClasses.filter((c: any) => !targetClassIds.has(c.id))
    for (const classData of newClasses) {
      await this.targetAPI.createClass(classData)
    }

    console.log(`[v0] Synced ${newClasses.length} new classes`)
    return { synced: newClasses.length }
  }
}

// Örnek kullanım
export function createAdminIntegration(config: {
  schoolSystemUrl: string
  adminPanelUrl: string
  adminToken: string
  webhookUrl?: string
  webhookSecret?: string
}) {
  const schoolAPI = new AdminAPIClient(config.schoolSystemUrl, config.adminToken)
  const adminAPI = new AdminAPIClient(config.adminPanelUrl, config.adminToken)

  const webhook =
    config.webhookUrl && config.webhookSecret ? new WebhookHandler(config.webhookUrl, config.webhookSecret) : null

  const bulkOps = new BulkOperations(schoolAPI)
  const dataSync = new DataSync(schoolAPI, adminAPI)

  return {
    schoolAPI,
    adminAPI,
    webhook,
    bulkOps,
    dataSync,
  }
}
