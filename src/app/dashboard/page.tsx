import { auth } from '@/auth'
import { redirect } from 'next/navigation'

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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <p className="text-zinc-500 text-sm text-center">
          {isAdmin ? 'Área do admin — em construção.' : 'Seus treinos aparecerão aqui em breve.'}
        </p>
      </div>
    </main>
  )
}
