import type { Metadata } from 'next'
import { Geist, Inter, Rajdhani, Oswald } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

const geist    = Geist   ({ subsets: ['latin'], variable: '--font-geist' })
const inter    = Inter   ({ subsets: ['latin'], variable: '--font-inter' })
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-rajdhani' })
const oswald   = Oswald  ({ subsets: ['latin'], variable: '--font-oswald' })

export const metadata: Metadata = {
  title: 'GS Performance',
  description: 'Plataforma de treinos GS Performance',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontFamilies = {
    geist:    geist.style.fontFamily,
    inter:    inter.style.fontFamily,
    rajdhani: rajdhani.style.fontFamily,
    oswald:   oswald.style.fontFamily,
  }

  return (
    <html
      lang="pt-BR"
      className={`${geist.variable} ${inter.variable} ${rajdhani.variable} ${oswald.variable}`}
      data-fonts={JSON.stringify(fontFamilies)}
    >
      <body className="bg-zinc-950 text-white">
        <SessionProvider>
          <ThemeProvider fontFamilies={fontFamilies}>
            <Navbar />
            {children}
            <ThemeSwitcher fontFamilies={fontFamilies} />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
