'use client'
import { useEffect } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const theme = localStorage.getItem('gs_theme')
    if (theme && theme !== 'laranja') {
      document.documentElement.setAttribute('data-theme', theme)
    }
    const font = localStorage.getItem('gs_font')
    if (font && font !== 'geist') {
      document.documentElement.setAttribute('data-font', font)
    }
  }, [])
  return <>{children}</>
}
