# Admin Panel Entegrasyon Örnekleri

## 1. Temel Kurulum

\`\`\`typescript
import { createAdminIntegration } from '@/lib/admin-integration'

// Admin panel entegrasyonunu başlat
const integration = createAdminIntegration({
  schoolSystemUrl: 'https://school-system.vercel.app',
  adminPanelUrl: 'https://admin-panel.example.com',
  adminToken: 'your-admin-token-here',
  webhookUrl: 'https://admin-panel.example.com/webhooks/school',
  webhookSecret: 'your-webhook-secret',
})
\`\`\`

## 2. Kullanıcı Yönetimi

### Tüm kullanıcıları listeleme
\`\`\`typescript
const users = await integration.schoolAPI.getUsers()
console.log('Toplam kullanıcı:', users.length)
\`\`\`

### Yeni kullanıcı oluşturma
\`\`\`typescript
const newUser = await integration.schoolAPI.createUser({
  name: 'Ahmet Yılmaz',
  phone: '05551234567',
  type: 'teacher',
  password: 'securePassword123',
})
\`\`\`

### Kullanıcı güncelleme
\`\`\`typescript
await integration.schoolAPI.updateUser('user-id', {
  name: 'Ahmet Yılmaz (Güncellendi)',
  phone: '05559876543',
})
\`\`\`

## 3. Kayıt İstekleri Yönetimi

### Bekleyen kayıtları listeleme
\`\`\`typescript
const registrations = await integration.schoolAPI.getRegistrations()
const pending = registrations.filter(r => r.status === 'pending')
console.log('Bekleyen kayıt:', pending.length)
\`\`\`

### Kayıt onaylama
\`\`\`typescript
for (const registration of pending) {
  await integration.schoolAPI.approveRegistration(registration.id)
  console.log(`${registration.name} onaylandı`)
}
\`\`\`

## 4. Toplu İşlemler

### Toplu kullanıcı ekleme
\`\`\`typescript
const usersToAdd = [
  { name: 'Öğretmen 1', phone: '05551111111', type: 'teacher', password: 'pass1' },
  { name: 'Öğretmen 2', phone: '05552222222', type: 'teacher', password: 'pass2' },
  { name: 'Veli 1', phone: '05553333333', type: 'parent', password: 'pass3' },
]

const results = await integration.bulkOps.bulkCreateUsers(usersToAdd)
const successful = results.filter(r => r.success).length
console.log(`${successful}/${usersToAdd.length} kullanıcı eklendi`)
\`\`\`

### Toplu öğrenci ekleme
\`\`\`typescript
const studentsToAdd = [
  { name: 'Öğrenci 1', class: '9-A', studentNumber: '001', parentId: 'parent-1' },
  { name: 'Öğrenci 2', class: '9-A', studentNumber: '002', parentId: 'parent-2' },
  { name: 'Öğrenci 3', class: '9-B', studentNumber: '003', parentId: 'parent-3' },
]

const results = await integration.bulkOps.bulkCreateStudents(studentsToAdd)
\`\`\`

## 5. Webhook Kullanımı

### Yeni kullanıcı oluşturulduğunda bildirim gönderme
\`\`\`typescript
const newUser = await integration.schoolAPI.createUser({
  name: 'Yeni Öğretmen',
  phone: '05554444444',
  type: 'teacher',
  password: 'password',
})

// Admin panele webhook gönder
if (integration.webhook) {
  await integration.webhook.notifyUserCreated(newUser)
}
\`\`\`

### Sınav yüklendiğinde bildirim
\`\`\`typescript
// Sınav yükleme işleminden sonra
if (integration.webhook) {
  await integration.webhook.notifyExamUploaded({
    examId: 'exam-123',
    className: '9-A',
    examTitle: 'Matematik Sınavı',
    uploadDate: new Date().toISOString(),
  })
}
\`\`\`

## 6. Veri Senkronizasyonu

### Kullanıcıları senkronize etme
\`\`\`typescript
// Okul sisteminden admin panele kullanıcıları senkronize et
const result = await integration.dataSync.syncUsers()
console.log(`${result.synced} yeni kullanıcı senkronize edildi`)
\`\`\`

### Sınıfları senkronize etme
\`\`\`typescript
const result = await integration.dataSync.syncClasses()
console.log(`${result.synced} yeni sınıf senkronize edildi`)
\`\`\`

### Otomatik senkronizasyon (her 1 saatte bir)
\`\`\`typescript
setInterval(async () => {
  console.log('[v0] Otomatik senkronizasyon başlatılıyor...')
  
  try {
    await integration.dataSync.syncUsers()
    await integration.dataSync.syncClasses()
    console.log('[v0] Senkronizasyon tamamlandı')
  } catch (error) {
    console.error('[v0] Senkronizasyon hatası:', error)
  }
}, 60 * 60 * 1000) // 1 saat
\`\`\`

## 7. Raporlama

### Sistem istatistiklerini alma
\`\`\`typescript
const stats = await integration.schoolAPI.getSystemStats()
console.log('Sistem İstatistikleri:', {
  totalUsers: stats.totalUsers,
  totalStudents: stats.totalStudents,
  totalClasses: stats.totalClasses,
  totalExams: stats.totalExams,
})
\`\`\`

### Özel rapor oluşturma
\`\`\`typescript
const report = await integration.schoolAPI.generateReport('monthly-attendance', {
  month: '2025-01',
  classId: '9-A',
})
\`\`\`

## 8. Hata Yönetimi

\`\`\`typescript
try {
  const users = await integration.schoolAPI.getUsers()
} catch (error) {
  if (error.message.includes('401')) {
    console.error('Token geçersiz veya süresi dolmuş')
    // Yeni token al
  } else if (error.message.includes('403')) {
    console.error('Yetki yok')
  } else if (error.message.includes('429')) {
    console.error('Rate limit aşıldı, lütfen bekleyin')
  } else {
    console.error('Bilinmeyen hata:', error)
  }
}
\`\`\`

## 9. Admin Panel'de Webhook Dinleme

\`\`\`typescript
// Express.js örneği
app.post('/webhooks/school', async (req, res) => {
  const { event, data, signature } = req.body
  
  // Signature doğrulama
  const expectedSignature = generateSignature(event, data, WEBHOOK_SECRET)
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' })
  }
  
  // Event'e göre işlem yap
  switch(event) {
    case 'user.created':
      await handleUserCreated(data)
      break
      
    case 'exam.uploaded':
      await handleExamUploaded(data)
      await sendNotificationToAdmins('Yeni sınav yüklendi', data)
      break
      
    case 'payment.received':
      await handlePaymentReceived(data)
      await updateFinancialRecords(data)
      break
      
    case 'student.registered':
      await handleStudentRegistered(data)
      break
      
    default:
      console.log('Bilinmeyen event:', event)
  }
  
  res.json({ success: true })
})
\`\`\`

## 10. Güvenlik En İyi Uygulamaları

### Token yenileme
\`\`\`typescript
// Token'ın süresi dolmadan önce yenile
async function refreshTokenIfNeeded() {
  const user = await integration.schoolAPI.getCurrentUser()
  const tokenExp = JSON.parse(atob(user.token.split('.')[1])).exp
  const now = Date.now()
  
  // Token 1 saat içinde dolacaksa yenile
  if (tokenExp - now < 60 * 60 * 1000) {
    const newToken = await integration.schoolAPI.refreshToken()
    // Yeni token'ı kaydet
  }
}
\`\`\`

### Rate limiting kontrolü
\`\`\`typescript
let requestCount = 0
let resetTime = Date.now() + 60000 // 1 dakika

async function makeRequestWithRateLimit(fn: () => Promise<any>) {
  if (Date.now() > resetTime) {
    requestCount = 0
    resetTime = Date.now() + 60000
  }
  
  if (requestCount >= 60) {
    const waitTime = resetTime - Date.now()
    console.log(`Rate limit aşıldı, ${waitTime}ms bekleniyor...`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
    requestCount = 0
    resetTime = Date.now() + 60000
  }
  
  requestCount++
  return await fn()
}

// Kullanım
await makeRequestWithRateLimit(() => integration.schoolAPI.getUsers())
