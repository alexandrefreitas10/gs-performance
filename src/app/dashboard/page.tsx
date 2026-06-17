import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const isAdmin = (session.user as any).is_admin

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">
          Olá, {session.user?.name} 👋
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          {isAdmin ? 'Painel do Administrador' : 'Seus treinos de hoje'}
        </p>
      </div>

      {isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/atletas" className="bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-2xl p-6 transition-colors group">
            <div className="text-3xl mb-3">🏋️</div>
            <h2 className="text-white font-bold text-lg">Atletas</h2>
            <p className="text-zinc-500 text-sm mt-1">Gerenciar cadastros e senhas</p>
          </Link>
          <Link href="/treinos" className="bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-2xl p-6 transition-colors group">
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
