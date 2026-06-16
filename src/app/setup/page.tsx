'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const [form, setForm] = useState({ username: '', password: '', name: '' })
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setDone(true)
      setTimeout(() => router.push('/login'), 2000)
    } else {
      const d = await res.json()
      setError(d.error)
    }
  }

  if (done) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <p className="text-green-400 font-semibold">Admin criado! Redirecionando...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-black text-white mb-6 text-center">Configuração Inicial</h1>
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          {(['name', 'username', 'password'] as const).map(field => (
            <div key={field}>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">
                {field === 'name' ? 'Nome completo' : field === 'username' ? 'Usuário' : 'Senha'}
              </label>
              <input
                type={field === 'password' ? 'password' : 'text'}
                value={form[field]}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          ))}
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors">
            Criar Admin
          </button>
        </form>
      </div>
    </div>
  )
}
