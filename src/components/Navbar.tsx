'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function Navbar() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.is_admin
  const [open, setOpen] = useState(false)

  const adminLinks = [
    { href: '/atletas', label: 'Atletas' },
    { href: '/treinos', label: 'Treinos' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/ranking-benchmarks', label: 'Benchmarks' },
    { href: '/calendario', label: 'Calendário' },
  ]

  const athleteLinks = [
    { href: '/meus-treinos', label: 'Meus Treinos' },
    { href: '/meus-benchmarks', label: 'Meus Benchmarks' },
    { href: '/meus-objetivos', label: 'Objetivos' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/ranking-benchmarks', label: 'Benchmarks' },
    { href: '/calendario', label: 'Calendário' },
  ]

  const links = isAdmin ? adminLinks : athleteLinks

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="text-orange-500 font-black text-lg tracking-tight shrink-0">
          GS Performance
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-3">
            {links.map(l => (
              <Link key={l.href} href={l.href} className="text-zinc-400 hover:text-white text-sm transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3 border-l border-zinc-800 pl-4">
            <span className="text-zinc-500 text-sm">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ redirectTo: '/login' })}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-zinc-400 hover:text-white"
          onClick={() => setOpen(v => !v)}
          aria-label="Menu"
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-3 space-y-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-zinc-300 hover:text-white text-sm font-medium transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 mt-2 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-500 text-sm">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ redirectTo: '/login' })}
              className="px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
