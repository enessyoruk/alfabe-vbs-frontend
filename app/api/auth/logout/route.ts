// app/api/auth/logout/route.ts
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST() {
  // Bearer modelde sunucu tarafında iptal edilecek token yok.
  // Sadece frontend localStorage temizleyecek.
  const res = NextResponse.json({ success: true })

  // Varsayılan temizleme: Tarayıcıdaki cookie kalıntıları varsa onları da öldürelim.
  // (Backend artık cookie kullanmıyor ama eski oturumlardan kalan kalıntılar olabilir.)
  const kill = {
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: true,
    maxAge: 0,
  }

  res.cookies.set("vbs_session", "", kill)
  res.cookies.set("vbs_role", "", { ...kill, httpOnly: false })
  res.cookies.set("vbs_auth", "", { ...kill, httpOnly: false })

  return res
}
