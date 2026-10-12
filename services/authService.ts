export interface User {
  id: string
  name: string
  phone: string
  type: "parent" | "teacher"
  email?: string
}

export interface LoginCredentials {
  phone: string
  password: string
  type: "parent" | "teacher"
}

class AuthService {
  private mockUsers: User[] = [
    {
      id: "1",
      name: "Ahmet Yılmaz",
      phone: "05551234567",
      type: "parent",
      email: "ahmet@example.com",
    },
    {
      id: "2",
      name: "Ayşe Demir",
      phone: "05559876543",
      type: "teacher",
      email: "ayse@alfabe-akademi.com",
    },
    {
      id: "3",
      name: "Mehmet Kaya",
      phone: "05555555555",
      type: "parent",
      email: "mehmet@example.com",
    },
    {
      id: "4",
      name: "Fatma Özkan",
      phone: "05551111111",
      type: "teacher",
      email: "fatma@alfabe-akademi.com",
    },
  ]

  private mockPasswords: Record<string, string> = {
    "05551234567": "123456",
    "05559876543": "teacher123",
    "05555555555": "parent123",
    "05551111111": "ogretmen456",
  }

  async login(phone: string, password: string, userType: "parent" | "teacher"): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const cleanPhone = phone.replace(/\s/g, "")

    const user = this.mockUsers.find((u) => u.phone === cleanPhone && u.type === userType)

    if (!user) {
      throw new Error("Kullanıcı bulunamadı. Telefon numaranızı ve kullanıcı tipinizi kontrol edin.")
    }

    const expectedPassword = this.mockPasswords[cleanPhone]
    if (!expectedPassword || expectedPassword !== password) {
      throw new Error("Şifre hatalı. Lütfen tekrar deneyin.")
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(user))
    }

    return user
  }

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
    }
  }

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null

    const userStr = localStorage.getItem("currentUser")
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }
}

export const authService = new AuthService()
