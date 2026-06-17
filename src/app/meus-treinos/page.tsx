'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

interface Workout {
  id: number
  title: string
  date: string | null
  notes: string
  created_at: string
}

type Filter = 'hoje' | 'semana' | 'data' | 'todos'

function toLocalDateStr(date: Date) {
  return date.toISOString().split('T')[0]
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return toLocalDateStr(d)
}

function endOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() + (day === 0 ? 0 : 7 - day)
  d.setDate(diff)
  return toLocalDateStr(d)
}

export default function MeusTreinosPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('hoje')
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()))

  useEffect(() => {
    fetch('/api/meus-treinos')
      .then(r => r.json())
      .then(d => { setWorkouts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setWorkouts([]); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    const today = toLocalDateStr(new Date())
    if (filter === 'hoje') {
      return workouts.filter(w => w.date === today)
    }
    if (filter === 'semana') {
      const start = startOfWeek(new Date())
      const end = endOfWeek(new Date())
      return workouts.filter(w => w.date && w.date >= start && w.date <= end)
    }
    if (filter === 'data') {
      return workouts.filter(w => w.date === selectedDate)
    }
    return workouts
  }, [workouts, filter, selectedDate])

  function formatDate(d: string | null) {
    if (!d) return null
    const dateStr = d.includes('T') ? d : d + 'T12:00:00'
    const parsed = new Date(dateStr)
    if (isNaN(parsed.getTime())) return null
    return parsed.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: 'hoje', label: 'Hoje' },
    { key: 'semana', label: 'Esta semana' },
    { key: 'data', label: 'Escolher data' },
    { key: 'todos', label: 'Todos' },
  ]

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Meus Treinos</h1>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === t.key
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filter === 'data' && (
        <div className="mb-5">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500 text-sm text-center py-12">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-500 text-sm">
            {filter === 'hoje' && 'Nenhum treino para hoje.'}
            {filter === 'semana' && 'Nenhum treino nesta semana.'}
            {filter === 'data' && 'Nenhum treino nesta data.'}
            {filter === 'todos' && 'Nenhum treino atribuído ainda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(w => (
            <Link key={w.id} href={`/treinos/${w.id}`} className="block bg-zinc-900 border border-zinc-800 hover:border-orange-500 rounded-2xl p-5 transition-colors">
              <p className="text-white font-bold">{w.title}</p>
              {w.date && (
                <p className="text-orange-400 text-xs font-semibold mt-0.5 capitalize">{formatDate(w.date)}</p>
              )}
              {w.notes && (
                <p className="text-zinc-500 text-xs mt-1 line-clamp-1">{w.notes}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
