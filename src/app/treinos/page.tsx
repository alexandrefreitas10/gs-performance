'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Workout {
  id: number
  title: string
  date: string | null
  notes: string
  created_at: string
}

export default function TreinosPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/workouts')
    setWorkouts(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Excluir "${title}"?`)) return
    await fetch(`/api/workouts/${id}`, { method: 'DELETE' })
    load()
  }

  function formatDate(d: string | null) {
    if (!d) return null
    const dateStr = d.includes('T') ? d : d + 'T12:00:00'
    const parsed = new Date(dateStr)
    if (isNaN(parsed.getTime())) return null
    return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Treinos</h1>
          <p className="text-zinc-400 text-sm mt-1">{workouts.length} treino{workouts.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/treinos/novo"
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors"
        >
          + Novo treino
        </Link>
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm text-center py-12">Carregando...</p>
      ) : workouts.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-500 text-sm">Nenhum treino cadastrado ainda.</p>
          <Link href="/treinos/novo" className="mt-4 inline-block text-orange-400 hover:text-orange-300 text-sm font-semibold">
            Criar primeiro treino →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map(w => (
            <div key={w.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Link href={`/treinos/${w.id}`} className="text-white font-bold hover:text-orange-400 transition-colors">
                    {w.title}
                  </Link>
                  {w.date && (
                    <p className="text-orange-400 text-xs font-semibold mt-0.5">{formatDate(w.date)}</p>
                  )}
                  {w.notes && (
                    <p className="text-zinc-500 text-xs mt-1 line-clamp-1">{w.notes}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <Link
                    href={`/treinos/${w.id}`}
                    className="px-3 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    Ver
                  </Link>
                  <button
                    onClick={() => handleDelete(w.id, w.title)}
                    className="px-3 py-1.5 text-xs font-semibold text-red-400 bg-zinc-800 hover:bg-red-950 rounded-lg transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
