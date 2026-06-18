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
  return (
    <html lang="pt-BR">
      <body className={`${geist.variable} ${inter.variable} ${rajdhani.variable} ${oswald.variable} bg-zinc-950 text-white`}>
        <SessionProvider>
          <ThemeProvider>
            <Navbar />
            {children}
            <ThemeSwitcher />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
