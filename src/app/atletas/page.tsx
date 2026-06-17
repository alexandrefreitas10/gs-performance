'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Athlete {
  id: number
  username: string
  name: string
  created_at: string
}

export default function AtletasPage() {
  const router = useRouter()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', username: '', password: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [resetId, setResetId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')

  async function load() {
    const res = await fetch('/api/athletes')
    if (res.status === 401) { router.push('/dashboard'); return }
    setAthletes(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const res = await fetch('/api/athletes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ name: '', username: '', password: '' })
      setShowForm(false)
      load()
    } else {
      const d = await res.json()
      setFormError(d.error)
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Excluir ${name}? Esta ação não pode ser desfeita.`)) return
    await fetch(`/api/athletes/${id}`, { method: 'DELETE' })
    load()
  }

  async function handleResetPassword(id: number) {
    if (!newPassword) return
    await fetch(`/api/athletes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    })
    setResetId(null)
    setNewPassword('')
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Atletas</h1>
          <p className="text-zinc-400 text-sm mt-1">{athletes.length} atleta{athletes.length !== 1 ? 's' : ''} cadastrado{athletes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Novo atleta'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="text-white font-bold">Novo atleta</h2>
          {[
            { key: 'name', label: 'Nome completo' },
            { key: 'username', label: 'Usuário (login)' },
            { key: 'password', label: 'Senha inicial' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">{label}</label>
              <input
                type={key === 'password' ? 'password' : 'text'}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          ))}
          {formError && <p className="text-red-400 text-xs">{formError}</p>}
          <button type="submit" className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors">
            Criar atleta
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500 text-sm text-center py-12">Carregando...</p>
      ) : athletes.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-500 text-sm">Nenhum atleta cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {athletes.map(a => (
            <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{a.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">@{a.username}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/atletas/${a.id}/benchmarks`)}
                    className="px-3 py-1.5 text-xs font-semibold text-orange-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    Benchmarks
                  </button>
                  <button
                    onClick={() => router.push(`/atletas/${a.id}/objetivos`)}
                    className="px-3 py-1.5 text-xs font-semibold text-orange-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    Objetivos
                  </button>
                  <button
                    onClick={() => { setResetId(a.id); setNewPassword('') }}
                    className="px-3 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    Resetar senha
                  </button>
                  <button
                    onClick={() => handleDelete(a.id, a.name)}
                    className="px-3 py-1.5 text-xs font-semibold text-red-400 bg-zinc-800 hover:bg-red-950 rounded-lg transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>

              {resetId === a.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="password"
                    placeholder="Nova senha"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    onClick={() => handleResetPassword(a.id)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setResetId(null)}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
