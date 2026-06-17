'use client'

import { useState, useEffect, useMemo } from 'react'
import { BENCHMARK_DEFINITIONS, CATEGORIES } from '@/lib/benchmark-definitions'

interface Row {
  benchmark_name: string
  result_value: string
  athlete_name: string
  athlete_gender: string
}

const MEDAL = ['🥇', '🥈', '🥉']

function parseValue(value: string, unit: string): number {
  const v = value.trim()
  if (unit === 'tempo') {
    const colonMatch = v.match(/^(\d+):(\d+)$/)
    if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2])
    const mMatch = v.match(/^(\d+)m(\d+)/)
    if (mMatch) return parseInt(mMatch[1]) * 60 + parseInt(mMatch[2])
    return parseFloat(v.replace(',', '.')) || Infinity
  }
  return parseFloat(v.replace(',', '.').replace(/[^\d.]/g, '')) || 0
}

function sortRows(rows: Row[], unit: string) {
  return [...rows].sort((a, b) => {
    const va = parseValue(a.result_value, unit)
    const vb = parseValue(b.result_value, unit)
    return unit === 'tempo' ? va - vb : vb - va
  })
}

export default function RankingBenchmarksPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0])
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('')
  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'F'>('all')

  useEffect(() => {
    fetch('/api/benchmarks/leaderboard')
      .then(r => r.json())
      .then(d => { setRows(d); setLoading(false) })
  }, [])

  const benchmarksInCategory = useMemo(
    () => BENCHMARK_DEFINITIONS.filter(b => b.category === selectedCategory),
    [selectedCategory]
  )

  useEffect(() => {
    setSelectedBenchmark(benchmarksInCategory[0]?.name ?? '')
  }, [selectedCategory])

  const currentDef = BENCHMARK_DEFINITIONS.find(b => b.name === selectedBenchmark)

  const filtered = useMemo(() => {
    let r = rows.filter(r => r.benchmark_name === selectedBenchmark)
    if (genderFilter === 'M') r = r.filter(r => r.athlete_gender === 'M')
    if (genderFilter === 'F') r = r.filter(r => r.athlete_gender === 'F')
    return sortRows(r, currentDef?.unit ?? 'reps')
  }, [rows, selectedBenchmark, genderFilter, currentDef])

  if (loading) return <main className="max-w-3xl mx-auto px-4 py-8"><p className="text-zinc-500">Carregando...</p></main>

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Ranking de Benchmarks</h1>
        <p className="text-zinc-400 text-sm mt-1">Comparativo entre atletas por movimento</p>
      </div>

      {/* Categorias */}
      <div className="flex gap-2 flex-wrap mb-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              selectedCategory === cat ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Benchmarks da categoria */}
      <div className="mb-4">
        <select
          value={selectedBenchmark}
          onChange={e => setSelectedBenchmark(e.target.value)}
          className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {benchmarksInCategory.map(b => (
            <option key={b.name} value={b.name}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Filtro de gênero */}
      <div className="flex gap-2 mb-6">
        {([['all', 'Todos'], ['M', 'Homens'], ['F', 'Mulheres']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setGenderFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              genderFilter === val ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Ranking */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-white font-bold">{selectedBenchmark}</h2>
          {currentDef && (
            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
              {currentDef.unit === 'tempo' ? '⏱ Menor tempo' : currentDef.unit === 'lbs' ? '🏋️ Maior carga' : '🔁 Máx. repetições'}
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-8">Nenhum atleta registrou resultado neste benchmark ainda.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((r, i) => (
              <div
                key={r.athlete_name}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                  i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                  i === 1 ? 'bg-zinc-400/10 border border-zinc-400/20' :
                  i === 2 ? 'bg-orange-900/20 border border-orange-900/30' :
                  'bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl w-7 text-center">{MEDAL[i] ?? `${i + 1}º`}</span>
                  <div>
                    <span className="text-white font-semibold text-sm">{r.athlete_name}</span>
                    {r.athlete_gender && (
                      <span className={`ml-2 text-xs ${r.athlete_gender === 'M' ? 'text-blue-400' : 'text-pink-400'}`}>
                        {r.athlete_gender === 'M' ? '♂' : '♀'}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-white font-mono font-bold text-sm">
                  {r.result_value} <span className="text-zinc-500 text-xs font-normal">{currentDef?.unit !== 'tempo' ? currentDef?.unit : ''}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
