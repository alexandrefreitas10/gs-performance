'use client'

import { useState, useEffect, useMemo } from 'react'

interface Row {
  workout_id: number
  workout_title: string
  workout_date: string | null
  part_id: number
  part_title: string
  scoring_type: string
  user_id: number
  athlete_name: string
  athlete_gender: string
  result_value: string
  rpe: number | null
  completed: boolean
}

const SCORING_LABELS: Record<string, string> = {
  menor_tempo: '⏱ Menor tempo',
  max_reps: '🔁 Máx. repetições',
  maior_carga: '🏋️ Maior carga',
}

const MEDAL = ['🥇', '🥈', '🥉']

function parseResult(value: string, scoringType: string): number {
  const v = value.trim()
  if (scoringType === 'menor_tempo') {
    // aceita formatos: 18:42 / 18m42s / 18.42 / 1842
    const colonMatch = v.match(/^(\d+):(\d+)$/)
    if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2])
    const mMatch = v.match(/^(\d+)m(\d+)/)
    if (mMatch) return parseInt(mMatch[1]) * 60 + parseInt(mMatch[2])
    return parseFloat(v.replace(',', '.')) || Infinity
  }
  // max_reps e maior_carga: número maior é melhor
  return parseFloat(v.replace(',', '.').replace(/[^\d.]/g, '')) || 0
}

function rankAthletes(rows: Row[], scoringType: string) {
  const sorted = [...rows].sort((a, b) => {
    const va = parseResult(a.result_value, scoringType)
    const vb = parseResult(b.result_value, scoringType)
    return scoringType === 'menor_tempo' ? va - vb : vb - va
  })
  return sorted
}

function formatDate(d: string | null) {
  if (!d) return null
  const dateStr = d.includes('T') ? d : d + 'T12:00:00'
  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWorkout, setSelectedWorkout] = useState<number | null>(null)
  const [selectedPart, setSelectedPart] = useState<number | null>(null)
  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'F'>('all')

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => {
        setRows(d)
        setLoading(false)
        if (d.length > 0) {
          setSelectedWorkout(d[0].workout_id)
          setSelectedPart(d[0].part_id)
        }
      })
  }, [])

  const workouts = useMemo(() => {
    const seen = new Set<number>()
    return rows.filter(r => { if (seen.has(r.workout_id)) return false; seen.add(r.workout_id); return true })
  }, [rows])

  const parts = useMemo(() => {
    if (!selectedWorkout) return []
    const partRows = rows.filter(r => r.workout_id === selectedWorkout)
    const seen = new Set<number>()
    return partRows.filter(r => { if (seen.has(r.part_id)) return false; seen.add(r.part_id); return true })
  }, [rows, selectedWorkout])

  if (loading) return <main className="max-w-3xl mx-auto px-4 py-8"><p className="text-zinc-500">Carregando...</p></main>

  if (rows.length === 0) return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-4">Leaderboard</h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
        <p className="text-zinc-500 text-sm">Nenhum resultado registrado ainda.</p>
        <p className="text-zinc-600 text-xs mt-1">Os rankings aparecem quando atletas registram seus resultados em treinos com critério de ranking definido.</p>
      </div>
    </main>
  )

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Leaderboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Rankings por treino</p>
      </div>

      {/* Seletor de treino */}
      <div className="flex gap-2 flex-wrap mb-4">
        {workouts.map(w => (
          <button
            key={w.workout_id}
            onClick={() => {
              setSelectedWorkout(w.workout_id)
              const firstPart = rows.find(r => r.workout_id === w.workout_id)
              setSelectedPart(firstPart?.part_id ?? null)
            }}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              selectedWorkout === w.workout_id
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {w.workout_title}
            {w.workout_date && <span className="ml-1.5 text-xs opacity-70">{formatDate(w.workout_date)}</span>}
          </button>
        ))}
      </div>

      {/* Seletor de parte */}
      {parts.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-8">
          {parts.map(part => (
            <button
              key={part.part_id}
              onClick={() => setSelectedPart(part.part_id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedPart === part.part_id
                  ? 'bg-zinc-200 text-zinc-900'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {part.part_title}
            </button>
          ))}
        </div>
      )}

      {/* Filtro de gênero */}
      <div className="flex gap-2 mb-6">
        {([['all', 'Todos'], ['M', 'Homens'], ['F', 'Mulheres']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setGenderFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              genderFilter === val
                ? 'bg-orange-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Ranking da parte selecionada */}
      <div className="space-y-6">
        {parts.filter(part => !selectedPart || part.part_id === selectedPart).map(part => {
          const partRows = rows.filter(r => {
            if (r.part_id !== part.part_id) return false
            if (genderFilter === 'M') return r.athlete_gender === 'M'
            if (genderFilter === 'F') return r.athlete_gender === 'F'
            return true
          })
          const ranked = rankAthletes(partRows, part.scoring_type)

          return (
            <div key={part.part_id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-white font-bold">{part.part_title}</h2>
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
                  {SCORING_LABELS[part.scoring_type]}
                </span>
              </div>

              <div className="space-y-2">
                {ranked.map((r, i) => (
                  <div
                    key={r.user_id}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                      i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                      i === 1 ? 'bg-zinc-400/10 border border-zinc-400/20' :
                      i === 2 ? 'bg-orange-900/20 border border-orange-900/30' :
                      'bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl w-7 text-center">{MEDAL[i] ?? `${i + 1}º`}</span>
                      <span className="text-white font-semibold text-sm">{r.athlete_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-mono font-bold text-sm">{r.result_value}</span>
                      {r.rpe && <span className="px-2 py-0.5 bg-zinc-700 text-zinc-400 text-xs rounded-full">PSE {r.rpe}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}
