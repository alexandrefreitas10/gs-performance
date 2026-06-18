'use client'
import { useEffect } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem('gs_theme')
    if (saved && saved !== 'laranja') {
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])
  return <>{children}</>
}
