'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function Navbar() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.is_admin

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="text-orange-500 font-black text-lg tracking-tight">
          GS Performance
        </Link>

        <div className="flex items-center gap-4">
          {isAdmin && (
            <div className="flex items-center gap-3">
              <Link href="/atletas" className="text-zinc-400 hover:text-white text-sm transition-colors">Atletas</Link>
              <Link href="/treinos" className="text-zinc-400 hover:text-white text-sm transition-colors">Treinos</Link>
              <Link href="/leaderboard" className="text-zinc-400 hover:text-white text-sm transition-colors">Leaderboard</Link>
              <Link href="/ranking-benchmarks" className="text-zinc-400 hover:text-white text-sm transition-colors">Ranking</Link>
              <Link href="/calendario" className="text-zinc-400 hover:text-white text-sm transition-colors">Calendário</Link>
            </div>
          )}
          {!isAdmin && (
            <div className="flex items-center gap-3">
              <Link href="/meus-treinos" className="text-zinc-400 hover:text-white text-sm transition-colors">Meus Treinos</Link>
              <Link href="/meus-benchmarks" className="text-zinc-400 hover:text-white text-sm transition-colors">Benchmarks</Link>
              <Link href="/meus-objetivos" className="text-zinc-400 hover:text-white text-sm transition-colors">Objetivos</Link>
              <Link href="/leaderboard" className="text-zinc-400 hover:text-white text-sm transition-colors">Leaderboard</Link>
              <Link href="/ranking-benchmarks" className="text-zinc-400 hover:text-white text-sm transition-colors">Ranking</Link>
              <Link href="/calendario" className="text-zinc-400 hover:text-white text-sm transition-colors">Calendário</Link>
            </div>
          )}
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
      </div>
    </nav>
  )
}
