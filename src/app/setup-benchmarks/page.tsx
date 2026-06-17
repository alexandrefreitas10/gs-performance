'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BENCHMARK_DEFINITIONS, CATEGORIES } from '@/lib/benchmark-definitions'

export default function SetupBenchmarksPage() {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])

  function setValue(name: string, val: string) {
    setValues(prev => ({ ...prev, [name]: val }))
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
    window.location.href = '/dashboard'
  }

  const categoryDefs = BENCHMARK_DEFINITIONS.filter(d => d.category === activeCategory)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Seus Benchmarks</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Preencha seus recordes pessoais. Deixe em branco os que ainda não tem. Você pode editar depois.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
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

        {/* Fields */}
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

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar e Continuar'}
          </button>
          <button
            onClick={() => { window.location.href = '/dashboard' }}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-semibold rounded-xl transition-colors text-sm"
          >
            Pular
          </button>
        </div>
      </div>
    </div>
  )
}
