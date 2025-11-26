// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

function noStore(res: NextResponse) {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.headers.set("Pragma", "no-cache")
  res.headers.set("Expires", "0")
  return res
}

export async function POST(req: NextRequest) {
  const isHttps = req.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production"

  const res = NextResponse.json({ success: true })
  res.cookies.set({
    name: "vbs_session",
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isHttps,
    maxAge: 0,
  })
  res.cookies.set({
    name: "vbs_role",
    value: "",
    httpOnly: false,
    path: "/",
    sameSite: "lax",
    secure: isHttps,
    maxAge: 0,
  })
  res.cookies.set({
    name: "vbs_auth",
    value: "",
    httpOnly: false,
    path: "/",
    sameSite: "lax",
    secure: isHttps,
    maxAge: 0,
  })
  res.cookies.set({
  name: "vbs_backend",
  value: "",
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  secure: isHttps,
  maxAge: 0,
})

  return noStore(res)
}
