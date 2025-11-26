# Mobil Uygulama Entegrasyon Rehberi

## Genel Bakış

Bu sistem, React Native mobil uygulaması ile tam uyumlu çalışacak şekilde tasarlanmıştır. Tüm API'ler RESTful standartlarına uygun olarak geliştirilmiştir ve mobil uygulama kolayca entegre edilebilir.

## API Yapısı

### Base URL
\`\`\`
Production: https://your-domain.com/api
Development: http://localhost:3000/api
\`\`\`

### Kimlik Doğrulama

Tüm API istekleri Bearer token ile kimlik doğrulaması gerektirir:

\`\`\`typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
\`\`\`

### Token Yapısı

Token, base64 encoded JSON formatındadır:

\`\`\`typescript
{
  userId: string
  userType: 'parent' | 'teacher' | 'admin'
  phone: string
  exp: number // Expiration timestamp
  nonce: string // Security nonce
}
\`\`\`

## Mobil Uygulama İçin Hazır API'ler

### 1. Authentication APIs

#### Login
\`\`\`typescript
POST /api/auth/login
Body: {
  phone: string
  password: string
  userType: 'parent' | 'teacher'
}
Response: {
  success: boolean
  user: User
  token: string
}
\`\`\`

#### Logout
\`\`\`typescript
POST /api/auth/logout
Headers: { Authorization: Bearer token }
\`\`\`

### 2. Notifications API (YENİ)

#### Get Notifications
\`\`\`typescript
GET /api/notifications
Headers: { Authorization: Bearer token }
Response: {
  success: boolean
  notifications: Notification[]
  unreadCount: number
}
\`\`\`

#### Mark as Read
\`\`\`typescript
PUT /api/notifications
Headers: { Authorization: Bearer token }
Body: {
  action: 'markAsRead' | 'markAllAsRead'
  notificationId?: string
}
\`\`\`

### 3. Homework APIs

#### Get Homework
\`\`\`typescript
GET /api/homework?studentId={id}
Headers: { Authorization: Bearer token }
\`\`\`

#### Create Homework (Teacher)
\`\`\`typescript
POST /api/homework
Headers: { Authorization: Bearer token }
Body: {
  classId: string
  className: string
  title: string
  description: string
  dueDate: string
}
\`\`\`

### 4. Exam APIs

#### Get Exams
\`\`\`typescript
GET /api/exams?studentId={id}&type=general
Headers: { Authorization: Bearer token }
\`\`\`

#### Upload Exam (Teacher)
\`\`\`typescript
POST /api/exams
Headers: { Authorization: Bearer token }
Body: {
  type: 'general' | 'individual'
  classId: string
  className: string
  examTitle: string
  studentId?: string
  score?: number
}
\`\`\`

### 5. Guidance Notes API

#### Get Guidance Notes (Parent)
\`\`\`typescript
GET /api/parent/guidance-notes
Headers: { Authorization: Bearer token }
\`\`\`

#### Create Guidance Note (Teacher)
\`\`\`typescript
POST /api/teacher/guidance
Headers: { Authorization: Bearer token }
Body: {
  studentId: string
  area: string
  content: string
}
\`\`\`

## React Native Entegrasyon Örneği

### API Service Setup

\`\`\`typescript
// services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE_URL = 'https://your-domain.com/api'

class ApiService {
  private async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken')
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getToken()
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  // Authentication
  async login(phone: string, password: string, userType: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password, userType }),
    })
    
    if (data.success) {
      await AsyncStorage.setItem('authToken', data.user.token)
      await AsyncStorage.setItem('user', JSON.stringify(data.user))
    }
    
    return data
  }

  // Notifications
  async getNotifications() {
    return this.request('/notifications')
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request('/notifications', {
      method: 'PUT',
      body: JSON.stringify({ 
        action: 'markAsRead', 
        notificationId 
      }),
    })
  }

  // Homework
  async getHomework(studentId: string) {
    return this.request(`/homework?studentId=${studentId}`)
  }

  // Exams
  async getExams(studentId: string) {
    return this.request(`/exams?studentId=${studentId}`)
  }
}

export default new ApiService()
\`\`\`

### Push Notifications Setup

\`\`\`typescript
// services/pushNotifications.ts
import messaging from '@react-native-firebase/messaging'
import ApiService from './api'

export const setupPushNotifications = async () => {
  // Request permission
  const authStatus = await messaging().requestPermission()
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL

  if (enabled) {
    // Get FCM token
    const fcmToken = await messaging().getToken()
    
    // Send token to backend (implement this endpoint)
    await ApiService.request('/notifications/register-device', {
      method: 'POST',
      body: JSON.stringify({ fcmToken }),
    })
  }
}

// Handle foreground notifications
messaging().onMessage(async remoteMessage => {
  console.log('Notification received:', remoteMessage)
  // Show local notification or update UI
})
\`\`\`

### Example Screen: Notifications

\`\`\`typescript
// screens/NotificationsScreen.tsx
import React, { useEffect, useState } from 'react'
import { View, FlatList, Text, TouchableOpacity } from 'react-native'
import ApiService from '../services/api'

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const data = await ApiService.getNotifications()
      setNotifications(data.notifications)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationPress = async (notification) => {
    if (!notification.isRead) {
      await ApiService.markNotificationAsRead(notification.id)
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, isRead: true } : n
        )
      )
    }
  }

  return (
    <View>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleNotificationPress(item)}>
            <View style={{ 
              padding: 16, 
              backgroundColor: item.isRead ? '#fff' : '#e3f2fd' 
            }}>
              <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
              <Text>{item.message}</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                {new Date(item.date).toLocaleDateString('tr-TR')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}
\`\`\`

## Güvenlik Önlemleri

1. **Token Storage**: AsyncStorage yerine daha güvenli Keychain/Keystore kullanın
2. **SSL Pinning**: Sertifika sabitleme ile MITM saldırılarını önleyin
3. **Biometric Auth**: Touch ID/Face ID entegrasyonu ekleyin
4. **Token Refresh**: Token yenileme mekanizması implement edin

## Önerilen Kütüphaneler

\`\`\`json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^1.19.0",
    "@react-native-firebase/messaging": "^18.0.0",
    "react-native-keychain": "^8.1.0",
    "react-native-biometrics": "^3.0.0",
    "axios": "^1.4.0"
  }
}
\`\`\`

## Sonraki Adımlar

1. Push notification backend entegrasyonu (FCM/APNs)
2. Offline mode desteği (local database)
3. Real-time updates (WebSocket)
4. Deep linking support
5. App analytics integration
