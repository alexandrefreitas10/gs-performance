'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BENCHMARK_DEFINITIONS, CATEGORIES, BenchmarkCategory } from '@/lib/benchmark-definitions'

export default function AtletaBenchmarksPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [benchmarks, setBenchmarks] = useState<Record<string, string>>({})
  const [athleteName, setAthleteName] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<BenchmarkCategory>(CATEGORIES[0])

  useEffect(() => {
    Promise.all([
      fetch(`/api/benchmarks/athlete/${id}`).then(r => r.json()),
      fetch('/api/athletes').then(r => r.json()),
    ]).then(([rows, athletes]) => {
      const map: Record<string, string> = {}
      rows.forEach((r: { benchmark_name: string; result_value: string }) => {
        map[r.benchmark_name] = r.result_value
      })
      setBenchmarks(map)
      const athlete = athletes.find((a: { id: number; name: string }) => a.id === Number(id))
      if (athlete) setAthleteName(athlete.name)
      setLoading(false)
    })
  }, [id])

  const categoryDefs = BENCHMARK_DEFINITIONS.filter(d => d.category === activeCategory)
  const filled = categoryDefs.filter(d => benchmarks[d.name])

  if (loading) {
    return <main className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="text-zinc-400">Carregando...</div></main>
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button onClick={() => router.push('/atletas')} className="text-zinc-500 text-sm hover:text-white mb-3 block">
            ← Atletas
          </button>
          <h1 className="text-2xl font-black">{athleteName}</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Benchmarks</p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => {
            const catDefs = BENCHMARK_DEFINITIONS.filter(d => d.category === cat)
            const catFilled = catDefs.filter(d => benchmarks[d.name]).length
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
                <span className="ml-1.5 text-xs opacity-70">{catFilled}/{catDefs.length}</span>
              </button>
            )
          })}
        </div>

        <div className="space-y-3">
          {categoryDefs.map(def => (
            <div key={def.name} className={`flex items-center justify-between bg-zinc-900 border rounded-xl px-4 py-3 ${benchmarks[def.name] ? 'border-zinc-700' : 'border-zinc-800'}`}>
              <span className={`text-sm ${benchmarks[def.name] ? 'text-zinc-200' : 'text-zinc-500'}`}>{def.name}</span>
              {benchmarks[def.name] ? (
                <span className="text-orange-400 font-bold text-sm">
                  {benchmarks[def.name]} <span className="text-zinc-500 font-normal text-xs">{def.unit}</span>
                </span>
              ) : (
                <span className="text-zinc-600 text-xs">—</span>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          {filled.length} de {categoryDefs.length} preenchidos nesta categoria
        </p>
      </div>
    </main>
  )
}
