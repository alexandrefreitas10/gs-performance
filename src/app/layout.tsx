import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import Navbar from '@/components/Navbar'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GS Performance',
  description: 'Plataforma de treinos GS Performance',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.className} bg-zinc-950 text-white`}>
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
