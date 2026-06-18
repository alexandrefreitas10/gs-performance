'use client'
import { useEffect } from 'react'

type Props = {
  children: React.ReactNode
  fontFamilies: Record<string, string>
}

export function ThemeProvider({ children, fontFamilies }: Props) {
  useEffect(() => {
    const theme = localStorage.getItem('gs_theme')
    if (theme && theme !== 'laranja') {
      document.documentElement.setAttribute('data-theme', theme)
    }
    const font = localStorage.getItem('gs_font')
    if (font && font !== 'geist') {
      const family = fontFamilies[font]
      if (family) document.body.style.fontFamily = family
    }
  }, [])
  return <>{children}</>
}
