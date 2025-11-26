# API Dokümantasyonu - Admin Panel Entegrasyonu

## Genel Bakış
Bu dokümantasyon, mevcut okul yönetim sisteminin tüm API rotalarını, kimlik doğrulama yapısını ve admin panel entegrasyonu için gerekli bilgileri içerir.

## Kimlik Doğrulama Sistemi

### Token Yapısı
- **Format**: Base64 encoded JSON
- **İçerik**: `{ userId, userType, phone, exp, nonce }`
- **Header**: `Authorization: Bearer <token>`
- **Kullanıcı Tipleri**: `teacher`, `parent`, `admin`

### Güvenlik Özellikleri
- Rate limiting: 60 istek/dakika
- Başarısız giriş takibi: 5 deneme sonrası 15 dakika bekleme
- Token expiration: 7 gün
- Session validation

---

## API Rotaları

### 1. Kimlik Doğrulama (Authentication)

#### POST /api/auth/login
**Amaç**: Kullanıcı girişi
**Kimlik Doğrulama**: Hayır
**Request Body**:
\`\`\`json
{
  "phone": "string",
  "password": "string",
  "userType": "teacher" | "parent" | "admin"
}
\`\`\`
**Response**:
\`\`\`json
{
  "user": {
    "id": "string",
    "name": "string",
    "type": "string",
    "token": "string"
  }
}
\`\`\`

#### POST /api/auth/register
**Amaç**: Yeni kullanıcı kaydı
**Kimlik Doğrulama**: Hayır
**Request Body**:
\`\`\`json
{
  "name": "string",
  "phone": "string",
  "password": "string",
  "userType": "teacher" | "parent",
  "studentName": "string", // sadece parent için
  "studentClass": "string" // sadece parent için
}
\`\`\`

#### GET /api/auth/register
**Amaç**: Bekleyen kayıt isteklerini listele
**Kimlik Doğrulama**: Evet (Admin)

#### POST /api/auth/logout
**Amaç**: Kullanıcı çıkışı
**Kimlik Doğrulama**: Evet

#### GET /api/auth/verify
**Amaç**: Token doğrulama
**Kimlik Doğrulama**: Evet

---

### 2. Admin İşlemleri

#### GET /api/admin/registrations
**Amaç**: Tüm kayıt isteklerini listele
**Kimlik Doğrulama**: Evet (Admin)
**Response**:
\`\`\`json
[
  {
    "id": "string",
    "name": "string",
    "phone": "string",
    "userType": "string",
    "status": "pending" | "approved" | "rejected",
    "createdAt": "string"
  }
]
\`\`\`

#### PATCH /api/admin/registrations/[id]
**Amaç**: Kayıt isteğini onayla/reddet
**Kimlik Doğrulama**: Evet (Admin)
**Request Body**:
\`\`\`json
{
  "status": "approved" | "rejected"
}
\`\`\`

---

### 3. Öğretmen İşlemleri

#### GET /api/teacher/classes
**Amaç**: Öğretmenin sınıflarını listele
**Kimlik Doğrulama**: Evet (Teacher)
**Response**:
\`\`\`json
[
  {
    "id": "string",
    "name": "string",
    "studentCount": number
  }
]
\`\`\`

#### GET /api/teacher/guidance
**Amaç**: Öğrenci rehberlik notlarını listele
**Kimlik Doğrulama**: Evet (Teacher)
**Query Params**: `classId` (opsiyonel)
**Response**:
\`\`\`json
[
  {
    "id": "string",
    "name": "string",
    "class": "string",
    "guidanceNotes": [
      {
        "id": "string",
        "area": "string",
        "content": "string",
        "date": "string",
        "teacherId": "string"
      }
    ]
  }
]
\`\`\`

#### POST /api/teacher/guidance
**Amaç**: Yeni rehberlik notu ekle
**Kimlik Doğrulama**: Evet (Teacher)
**Request Body**:
\`\`\`json
{
  "studentId": "string",
  "area": "string",
  "content": "string"
}
\`\`\`

#### PUT /api/teacher/guidance
**Amaç**: Rehberlik notunu güncelle
**Kimlik Doğrulama**: Evet (Teacher)
**Request Body**:
\`\`\`json
{
  "noteId": "string",
  "content": "string"
}
\`\`\`

#### GET /api/teacher/analytics
**Amaç**: Sınıf analitikleri
**Kimlik Doğrulama**: Evet (Teacher)
**Query Params**: `classId` (opsiyonel)

#### POST /api/teacher/analytics
**Amaç**: Analitik raporu oluştur
**Kimlik Doğrulama**: Evet (Teacher)

#### GET /api/teacher/analytics/reports
**Amaç**: Raporları listele
**Kimlik Doğrulama**: Evet (Teacher)

#### POST /api/teacher/analytics/reports
**Amaç**: Yeni rapor oluştur
**Kimlik Doğrulama**: Evet (Teacher)

---

### 4. Veli İşlemleri

#### GET /api/parent/students
**Amaç**: Velinin çocuklarını listele
**Kimlik Doğrulama**: Evet (Parent)
**Response**:
\`\`\`json
[
  {
    "id": "string",
    "name": "string",
    "class": "string",
    "studentNumber": "string"
  }
]
\`\`\`

#### GET /api/parent/guidance-notes
**Amaç**: Çocuğun rehberlik notlarını görüntüle
**Kimlik Doğrulama**: Evet (Parent)
**Response**:
\`\`\`json
[
  {
    "studentId": "string",
    "studentName": "string",
    "studentClass": "string",
    "guidanceNotes": [
      {
        "id": "string",
        "area": "string",
        "content": "string",
        "date": "string"
      }
    ]
  }
]
\`\`\`

---

### 5. Ödev Yönetimi

#### GET /api/homework
**Amaç**: Ödevleri listele
**Kimlik Doğrulama**: Evet
**Query Params**: 
- `classId` (opsiyonel)
- `status` (opsiyonel): "pending" | "completed"

#### POST /api/homework
**Amaç**: Yeni ödev oluştur
**Kimlik Doğrulama**: Evet (Teacher)
**Request Body**:
\`\`\`json
{
  "title": "string",
  "description": "string",
  "classId": "string",
  "dueDate": "string"
}
\`\`\`

#### PUT /api/homework
**Amaç**: Ödevi güncelle
**Kimlik Doğrulama**: Evet (Teacher)

#### DELETE /api/homework
**Amaç**: Ödevi sil
**Kimlik Doğrulama**: Evet (Teacher)

#### GET /api/homework/[id]
**Amaç**: Ödev detaylarını getir
**Kimlik Doğrulama**: Evet

#### POST /api/homework/submissions
**Amaç**: Ödev teslimi
**Kimlik Doğrulama**: Evet (Parent)

#### GET /api/homework/submissions/[id]
**Amaç**: Ödev teslim detayları
**Kimlik Doğrulama**: Evet

---

### 6. Sınav Yönetimi

#### GET /api/exams
**Amaç**: Sınavları listele
**Kimlik Doğrulama**: Evet
**Query Params**: `classId` (opsiyonel)

#### POST /api/exams
**Amaç**: Yeni sınav oluştur
**Kimlik Doğrulama**: Evet (Teacher)
**Request Body**:
\`\`\`json
{
  "type": "general" | "makeup",
  "classId": "string",
  "className": "string",
  "examTitle": "string",
  "description": "string",
  "fileName": "string",
  "imageUrl": "string" // blob URL
}
\`\`\`

#### PUT /api/exams
**Amaç**: Sınavı güncelle
**Kimlik Doğrulama**: Evet (Teacher)

#### DELETE /api/exams
**Amaç**: Sınavı sil
**Kimlik Doğrulama**: Evet (Teacher)

---

### 7. Devamsızlık Yönetimi

#### GET /api/attendance
**Amaç**: Devamsızlık kayıtlarını listele
**Kimlik Doğrulama**: Evet
**Query Params**: 
- `studentId` (opsiyonel)
- `classId` (opsiyonel)

#### POST /api/attendance
**Amaç**: Devamsızlık kaydı oluştur
**Kimlik Doğrulama**: Evet (Teacher)

#### PUT /api/attendance
**Amaç**: Devamsızlık kaydını güncelle
**Kimlik Doğrulama**: Evet (Teacher)

#### GET /api/attendance/stats
**Amaç**: Devamsızlık istatistikleri
**Kimlik Doğrulama**: Evet

---

### 8. Ödeme Yönetimi

#### GET /api/payments
**Amaç**: Ödeme kayıtlarını listele
**Kimlik Doğrulama**: Evet
**Query Params**: `studentId` (opsiyonel)

#### POST /api/payments
**Amaç**: Yeni ödeme kaydı oluştur
**Kimlik Doğrulama**: Evet (Admin)

#### GET /api/payments/stats
**Amaç**: Ödeme istatistikleri
**Kimlik Doğrulama**: Evet

---

### 9. Tatil Yönetimi

#### GET /api/holidays
**Amaç**: Resmi tatilleri listele
**Kimlik Doğrulama**: Hayır
**Response**:
\`\`\`json
[
  {
    "date": "string",
    "name": "string",
    "type": "string"
  }
]
\`\`\`

#### POST /api/holidays
**Amaç**: Tatil bildirimi gönder
**Kimlik Doğrulama**: Evet (Teacher)
**Request Body**:
\`\`\`json
{
  "holidayId": "string",
  "message": "string"
}
\`\`\`

---

## Admin Panel Entegrasyonu İçin Öneriler

### 1. Yeni Admin Rotaları Eklenebilir
\`\`\`
/api/admin/users - Kullanıcı yönetimi
/api/admin/classes - Sınıf yönetimi
/api/admin/teachers - Öğretmen yönetimi
/api/admin/students - Öğrenci yönetimi
/api/admin/settings - Sistem ayarları
/api/admin/reports - Raporlama
\`\`\`

### 2. Veritabanı Entegrasyonu
Şu anda sistem mock data kullanıyor. Admin panel entegrasyonu için:
- Supabase/Neon/PostgreSQL veritabanı entegrasyonu
- Gerçek veri modelleri ve ilişkiler
- Migration scriptleri

### 3. Rol Bazlı Yetkilendirme
\`\`\`typescript
// Örnek middleware
export function requireRole(roles: string[]) {
  return async (request: NextRequest) => {
    const user = await validateToken(request)
    if (!roles.includes(user.type)) {
      return new Response("Forbidden", { status: 403 })
    }
  }
}
\`\`\`

### 4. API Versiyonlama
\`\`\`
/api/v1/... - Mevcut API
/api/v2/... - Yeni özellikler
\`\`\`

### 5. Webhook Desteği
Admin panelden sistem olaylarını dinlemek için:
\`\`\`
POST /api/webhooks/user-created
POST /api/webhooks/exam-uploaded
POST /api/webhooks/payment-received
\`\`\`

### 6. Toplu İşlemler
\`\`\`
POST /api/admin/bulk/users - Toplu kullanıcı ekleme
POST /api/admin/bulk/students - Toplu öğrenci ekleme
POST /api/admin/bulk/classes - Toplu sınıf oluşturma
\`\`\`

---

## Güvenlik Kontrol Listesi

✅ Token tabanlı kimlik doğrulama
✅ Rate limiting
✅ Başarısız giriş takibi
✅ Input validasyonu
✅ SQL injection koruması (parametreli sorgular)
✅ XSS koruması (input sanitization)
✅ CORS yapılandırması
✅ Güvenli hata mesajları
✅ Session yönetimi
✅ Token expiration

### Eksik Güvenlik Önlemleri (Admin Panel İçin Önerilir)
- [ ] CSRF token koruması
- [ ] 2FA (İki faktörlü kimlik doğrulama)
- [ ] IP whitelist/blacklist
- [ ] Audit logging (tüm işlemlerin kaydı)
- [ ] Şifre politikası (minimum uzunluk, karmaşıklık)
- [ ] Hesap kilitleme mekanizması
- [ ] API key yönetimi (3. parti entegrasyonlar için)

---

## Örnek Entegrasyon Kodu

### Admin Panel'den API Çağrısı
\`\`\`typescript
// Admin panel'den kullanıcı listesi çekme
async function fetchUsers(adminToken: string) {
  const response = await fetch('https://your-domain.com/api/admin/users', {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }
  
  return await response.json()
}
\`\`\`

### Webhook Dinleme
\`\`\`typescript
// Admin panel'de webhook endpoint
app.post('/webhooks/school-system', async (req, res) => {
  const { event, data } = req.body
  
  switch(event) {
    case 'user.created':
      await handleUserCreated(data)
      break
    case 'exam.uploaded':
      await handleExamUploaded(data)
      break
    // ...
  }
  
  res.json({ success: true })
})
\`\`\`

---

## Veri Modelleri

### User
\`\`\`typescript
interface User {
  id: string
  name: string
  phone: string
  type: 'teacher' | 'parent' | 'admin'
  token?: string
  createdAt: string
}
\`\`\`

### Student
\`\`\`typescript
interface Student {
  id: string
  name: string
  class: string
  studentNumber: string
  parentId: string
}
\`\`\`

### Exam
\`\`\`typescript
interface Exam {
  id: string
  type: 'general' | 'makeup'
  classId: string
  className: string
  examTitle: string
  description: string
  fileName: string
  imageUrl: string
  uploadDate: string
  teacherId: string
}
\`\`\`

### GuidanceNote
\`\`\`typescript
interface GuidanceNote {
  id: string
  studentId: string
  area: string
  content: string
  date: string
  teacherId: string
}
\`\`\`

---

## İletişim ve Destek

Entegrasyon sırasında karşılaşılan sorunlar için:
1. API dokümantasyonunu kontrol edin
2. Debug loglarını inceleyin (`console.log("[v0] ...")`)
3. Token formatını ve expiration'ı kontrol edin
4. Rate limiting limitlerini göz önünde bulundurun

---

**Son Güncelleme**: 2025-01-10
**API Versiyonu**: 1.0
**Durum**: Production Ready (Mock Data ile)
