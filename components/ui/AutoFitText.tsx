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
  maxSize = 28,   // PC görünümü bozulmaz
  minSize = 14,   // Mobil için minimum okunabilir font
  className = "",
}: AutoFitTextProps) {

  const ref = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(maxSize)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const resize = () => {
      let size = maxSize
      const parentWidth = el.parentElement?.clientWidth || 0

      // Metin sığana kadar fontu küçült
      while (size > minSize && el.scrollWidth > parentWidth) {
        size -= 1
        setFontSize(size)
      }
    }

    resize()

    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
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
