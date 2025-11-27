"use client"

import { useEffect, useState } from "react"

export default function CookieDebugPage() {
  const [backendCookie, setBackendCookie] = useState<any>(null)
  const [proxyData, setProxyData] = useState<any>(null)
  const [clientCookies, setClientCookies] = useState<string>("")

  useEffect(() => {
    // 1) Client-side tarayıcıdaki cookie'leri oku
    setClientCookies(document.cookie)

    // 2) Backend cookie-test endpoint'i çağır
    fetch("/api/debug/cookie-test", {
      method: "GET",
      credentials: "include",
    })
      .then(r => r.json())
      .then(d => setBackendCookie(d))

    // 3) Parent/students proxy endpoint'ini çağır
    fetch("/api/parent/students", {
      method: "GET",
      credentials: "include",
    })
      .then(r => r.json())
      .then(d => setProxyData(d))
  }, [])

  return (
    <div style={{ padding: 30, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
      <h1>🍪 COOKIE DEBUG PANEL</h1>

      <h2>1) Tarayıcıdaki Cookie'ler (document.cookie):</h2>
      <pre>{clientCookies}</pre>

      <h2>2) Backend /api/debug/cookie-test cevabı:</h2>
      <pre>{JSON.stringify(backendCookie, null, 2)}</pre>

      <h2>3) Proxy /api/parent/students cevabı:</h2>
      <pre>{JSON.stringify(proxyData, null, 2)}</pre>
    </div>
  )
}
