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

interface Athlete {
  id: number
  name: string
  username: string
}

type Filter = 'hoje' | 'semana' | 'data' | 'todos'

function toLocalDateStr(date: Date) {
  return date.toISOString().split('T')[0]
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return toLocalDateStr(d)
}

function endOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day))
  return toLocalDateStr(d)
}

function formatDate(d: string | null) {
  if (!d) return null
  const dateStr = d.includes('T') ? d : d + 'T12:00:00'
  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TreinosPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('hoje')
  const [selectedDate, setSelectedDate] = useState(toLocalDateStr(new Date()))
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null)
  const [assignOpen, setAssignOpen] = useState<number | null>(null)
  const [assignees, setAssignees] = useState<Record<number, Athlete[]>>({})
  const [assignLoading, setAssignLoading] = useState<number | null>(null)

  async function loadWorkouts(athleteId: number | null) {
    setLoading(true)
    const url = athleteId ? `/api/workouts?athleteId=${athleteId}` : '/api/workouts'
    const res = await fetch(url)
    setWorkouts(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    fetch('/api/athletes').then(r => r.json()).then(setAthletes)
    loadWorkouts(null)
  }, [])

  useEffect(() => {
    loadWorkouts(selectedAthleteId)
  }, [selectedAthleteId])

  async function toggleAssign(workoutId: number) {
    if (assignOpen === workoutId) { setAssignOpen(null); return }
    setAssignLoading(workoutId)
    const res = await fetch(`/api/workouts/${workoutId}/assignments`)
    const data = await res.json()
    setAssignees(prev => ({ ...prev, [workoutId]: data }))
    setAssignLoading(null)
    setAssignOpen(workoutId)
  }

  async function handleAssign(workoutId: number, athleteId: number) {
    await fetch(`/api/workouts/${workoutId}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: [athleteId] }),
    })
    const res = await fetch(`/api/workouts/${workoutId}/assignments`)
    const data = await res.json()
    setAssignees(prev => ({ ...prev, [workoutId]: data }))
  }

  async function handleUnassign(workoutId: number, athleteId: number) {
    await fetch(`/api/workouts/${workoutId}/assignments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: athleteId }),
    })
    setAssignees(prev => ({ ...prev, [workoutId]: prev[workoutId]?.filter(a => a.id !== athleteId) ?? [] }))
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Excluir "${title}"?`)) return
    await fetch(`/api/workouts/${id}`, { method: 'DELETE' })
    loadWorkouts(selectedAthleteId)
  }

  const filtered = useMemo(() => {
    const today = toLocalDateStr(new Date())
    if (filter === 'hoje') return workouts.filter(w => {
      const d = w.date?.includes('T') ? w.date.split('T')[0] : w.date
      return d === today
    })
    if (filter === 'semana') {
      const start = startOfWeek(new Date())
      const end = endOfWeek(new Date())
      return workouts.filter(w => {
        const d = w.date?.includes('T') ? w.date.split('T')[0] : w.date
        return d && d >= start && d <= end
      })
    }
    if (filter === 'data') return workouts.filter(w => {
      const d = w.date?.includes('T') ? w.date.split('T')[0] : w.date
      return d === selectedDate
    })
    return workouts
  }, [workouts, filter, selectedDate])

  const tabs: { key: Filter; label: string }[] = [
    { key: 'hoje', label: 'Hoje' },
    { key: 'semana', label: 'Esta semana' },
    { key: 'data', label: 'Escolher data' },
    { key: 'todos', label: 'Todos' },
  ]

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">Treinos</h1>
          <p className="text-zinc-400 text-sm mt-1">{filtered.length} treino{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/treinos/novo" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors">
          + Novo treino
        </Link>
      </div>

      {/* Seletor de atleta */}
      <div className="mb-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedAthleteId(null)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              selectedAthleteId === null ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            Todos os atletas
          </button>
          {athletes.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedAthleteId(a.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                selectedAthleteId === a.id ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros de data */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === t.key ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:text-white'
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
            {filter === 'todos' && 'Nenhum treino cadastrado ainda.'}
          </p>
          {filter === 'todos' && (
            <Link href="/treinos/novo" className="mt-4 inline-block text-orange-400 hover:text-orange-300 text-sm font-semibold">
              Criar primeiro treino →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(w => (
            <div key={w.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <Link href={`/treinos/${w.id}`} className="text-white font-bold hover:text-orange-400 transition-colors">
                    {w.title}
                  </Link>
                  {w.date && <p className="text-orange-400 text-xs font-semibold mt-0.5">{formatDate(w.date)}</p>}
                  {w.notes && <p className="text-zinc-500 text-xs mt-1 line-clamp-1">{w.notes}</p>}
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <Link href={`/treinos/${w.id}`} className="px-3 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
                    Ver
                  </Link>
                  <button
                    onClick={() => toggleAssign(w.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${assignOpen === w.id ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-orange-400 hover:bg-zinc-700'}`}
                  >
                    {assignLoading === w.id ? '...' : 'Atribuir'}
                  </button>
                  <button onClick={() => handleDelete(w.id, w.title)} className="px-3 py-1.5 text-xs font-semibold text-red-400 bg-zinc-800 hover:bg-red-950 rounded-lg transition-colors">
                    Excluir
                  </button>
                </div>
              </div>

              {assignOpen === w.id && (
                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <p className="text-xs font-semibold text-zinc-400 mb-3">Atletas atribuídos</p>
                  <div className="space-y-2">
                    {athletes.map(a => {
                      const assigned = assignees[w.id]?.some(x => x.id === a.id) ?? false
                      return (
                        <label key={a.id} className="flex items-center justify-between gap-3 cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={assigned}
                              onChange={() => assigned ? handleUnassign(w.id, a.id) : handleAssign(w.id, a.id)}
                              className="accent-orange-500 w-4 h-4"
                            />
                            <span className="text-white text-sm">{a.name}</span>
                            <span className="text-zinc-500 text-xs">@{a.username}</span>
                          </div>
                          {assigned && <span className="text-xs text-green-400 font-semibold">✓ Atribuído</span>}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
