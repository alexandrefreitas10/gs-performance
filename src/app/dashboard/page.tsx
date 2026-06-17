'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <p className="text-zinc-500 text-sm">Carregando sessão...</p>
    </main>
  )

  if (status === 'unauthenticated' || !session) return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <p className="text-zinc-500 text-sm">Sessão não encontrada. <Link href="/login" className="text-orange-400 underline">Fazer login</Link></p>
    </main>
  )

  const isAdmin = (session.user as any)?.is_admin === true

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">
          Olá, {session.user?.name ?? 'Usuário'}
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {isAdmin ? 'Painel do Administrador' : 'Área do atleta'}
        </p>
      </div>

      {isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/atletas" className="bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-2xl p-6 transition-colors">
            <div className="text-3xl mb-3">🏋️</div>
            <h2 className="text-white font-bold text-lg">Atletas</h2>
            <p className="text-zinc-500 text-sm mt-1">Gerenciar cadastros e senhas</p>
          </Link>
          <Link href="/treinos" className="bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-2xl p-6 transition-colors">
            <div className="text-3xl mb-3">📋</div>
            <h2 className="text-white font-bold text-lg">Treinos</h2>
            <p className="text-zinc-500 text-sm mt-1">Criar e gerenciar treinos</p>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <Link href="/meus-treinos" className="bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-2xl p-6 transition-colors">
            <div className="text-3xl mb-3">📋</div>
            <h2 className="text-white font-bold text-lg">Meus Treinos</h2>
            <p className="text-zinc-500 text-sm mt-1">Ver treinos atribuídos</p>
          </Link>
        </div>
      )}
    </main>
  )
}
