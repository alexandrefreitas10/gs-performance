'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Goal {
  id: number
  type: 'curto_prazo' | 'longo_prazo'
  description: string
  completed: boolean
}

type GoalType = 'curto_prazo' | 'longo_prazo'

const TYPE_LABELS: Record<GoalType, string> = {
  curto_prazo: 'Curto Prazo',
  longo_prazo: 'Longo Prazo',
}

export default function AtletaObjetivosPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [athleteName, setAthleteName] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<GoalType>('curto_prazo')

  useEffect(() => {
    Promise.all([
      fetch(`/api/goals/athlete/${id}`).then(r => r.json()),
      fetch('/api/athletes').then(r => r.json()),
    ]).then(([goalRows, athletes]) => {
      setGoals(goalRows)
      const athlete = athletes.find((a: { id: number; name: string }) => a.id === Number(id))
      if (athlete) setAthleteName(athlete.name)
      setLoading(false)
    })
  }, [id])

  const filtered = goals.filter(g => g.type === activeType)
  const pending = filtered.filter(g => !g.completed)
  const done = filtered.filter(g => g.completed)

  if (loading) {
    return <main className="min-h-screen bg-zinc-950 flex items-center justify-center"><p className="text-zinc-400">Carregando...</p></main>
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button onClick={() => router.push('/atletas')} className="text-zinc-500 text-sm hover:text-white mb-3 block">
            ← Atletas
          </button>
          <h1 className="text-2xl font-black">{athleteName}</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Objetivos</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(['curto_prazo', 'longo_prazo'] as GoalType[]).map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                activeType === type
                  ? 'bg-orange-500 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {TYPE_LABELS[type]}
              <span className="ml-2 text-xs opacity-70">
                {goals.filter(g => g.type === type).length}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-600 text-sm">Nenhum objetivo de {TYPE_LABELS[activeType].toLowerCase()} cadastrado.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {pending.map(g => (
                <div key={g.id} className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-zinc-600 shrink-0" />
                  <p className="text-sm text-zinc-200">{g.description}</p>
                </div>
              ))}
            </div>

            {done.length > 0 && (
              <>
                <p className="text-zinc-600 text-xs font-semibold uppercase tracking-wider mt-6 mb-3">
                  Concluídos ({done.length})
                </p>
                <div className="space-y-2">
                  {done.map(g => (
                    <div key={g.id} className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 opacity-60">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-orange-500 border-2 border-orange-500 shrink-0 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <p className="text-sm text-zinc-500 line-through">{g.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}
