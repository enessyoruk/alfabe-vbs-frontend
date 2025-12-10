"use client"

import { useEffect, useRef, useState } from "react"

interface AutoFitTextProps {
  text: string
  maxSize?: number
  minSize?: number
  className?: string
}

export function AutoFitText({
  text,
  maxSize = 28,
  minSize = 14,
  className = "",
}: AutoFitTextProps) {
  
  const ref = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(maxSize)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const fit = () => {
      let low = minSize
      let high = maxSize
      let mid = maxSize

      const parentWidth = el.parentElement?.clientWidth || 0

      // Binary search ile en doğru font-size'ı bul
      while (low <= high) {
        mid = Math.floor((low + high) / 2)
        el.style.fontSize = `${mid}px`

        // Metin container'a sığıyor mu?
        if (el.scrollWidth <= parentWidth) {
          low = mid + 1
        } else {
          high = mid - 1
        }
      }

      setFontSize(high)
    }

    fit()

    const resizeObserver = new ResizeObserver(() => fit())
    resizeObserver.observe(el.parentElement!)

    window.addEventListener("resize", fit)
    return () => {
      window.removeEventListener("resize", fit)
      resizeObserver.disconnect()
    }
  }, [text, maxSize, minSize])

  return (
    <div
      ref={ref}
      style={{ fontSize: `${fontSize}px` }}
      className={`whitespace-nowrap overflow-hidden ${className}`}
    >
      {text}
    </div>
  )
}
