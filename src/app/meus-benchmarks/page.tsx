'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { BENCHMARK_DEFINITIONS, CATEGORIES, BenchmarkCategory } from '@/lib/benchmark-definitions'

export default function MeusBenchmarksPage() {
  const { data: session, status } = useSession()
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeCategory, setActiveCategory] = useState<BenchmarkCategory>(CATEGORIES[0])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/benchmarks')
      .then(r => r.json())
      .then((rows: { benchmark_name: string; result_value: string }[]) => {
        const map: Record<string, string> = {}
        rows.forEach(r => { map[r.benchmark_name] = r.result_value })
        setValues(map)
        setLoading(false)
      })
  }, [status])

  function setValue(name: string, val: string) {
    setValues(prev => ({ ...prev, [name]: val }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const entries = BENCHMARK_DEFINITIONS
      .filter(d => values[d.name]?.trim())
      .map(d => ({ benchmark_name: d.name, result_value: values[d.name].trim() }))
    await fetch('/api/benchmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    })
    setSaving(false)
    setSaved(true)
  }

  if (status === 'loading' || loading) {
    return <main className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="text-zinc-400">Carregando...</div></main>
  }

  const categoryDefs = BENCHMARK_DEFINITIONS.filter(d => d.category === activeCategory)

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Meus Benchmarks</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Seus recordes pessoais</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : saved ? 'Salvo ✓' : 'Salvar'}
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
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
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {categoryDefs.map(def => (
            <div key={def.name} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <span className="flex-1 text-sm text-zinc-200">{def.name}</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={values[def.name] ?? ''}
                  onChange={e => setValue(def.name, e.target.value)}
                  placeholder={def.unit === 'tempo' ? 'ex: 1:45' : def.unit === 'kg' ? 'ex: 80' : 'ex: 15'}
                  className="w-28 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-xs text-zinc-500 w-8">{def.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
