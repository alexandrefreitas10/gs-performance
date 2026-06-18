'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BENCHMARK_DEFINITIONS, CATEGORIES } from '@/lib/benchmark-definitions'
import { useWeightUnit, parseWeightToLbs, lbsToKg, kgToLbs, WeightUnit } from '@/hooks/useWeightUnit'

export default function SetupBenchmarksPage() {
  const router = useRouter()
  const { unit, setUnit, ready } = useWeightUnit()
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])

  function setValue(name: string, val: string) {
    setValues(prev => ({ ...prev, [name]: val }))
  }

  function handleUnitChange(newUnit: WeightUnit) {
    if (newUnit === unit) return
    const newValues: Record<string, string> = {}
    for (const [name, val] of Object.entries(values)) {
      const def = BENCHMARK_DEFINITIONS.find(d => d.name === name)
      if (def?.unit === 'lbs' && val.trim()) {
        const num = parseFloat(val.replace(',', '.'))
        if (!isNaN(num)) {
          newValues[name] = newUnit === 'kg'
            ? lbsToKg(num).toFixed(1)
            : String(Math.round(kgToLbs(num)))
        } else {
          newValues[name] = val
        }
      } else {
        newValues[name] = val
      }
    }
    setValues(newValues)
    setUnit(newUnit)
  }

  async function handleSave() {
    setSaving(true)
    const entries = BENCHMARK_DEFINITIONS
      .filter(d => values[d.name]?.trim())
      .map(d => ({
        benchmark_name: d.name,
        result_value: d.unit === 'lbs' ? parseWeightToLbs(values[d.name].trim(), unit) : values[d.name].trim(),
      }))

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
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Seus Benchmarks</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Preencha seus recordes pessoais. Deixe em branco os que ainda não tem. Você pode editar depois.
            </p>
          </div>
          {ready && (
            <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1 shrink-0 mt-1">
              <button
                onClick={() => handleUnitChange('kg')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${unit === 'kg' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'}`}
              >kg</button>
              <button
                onClick={() => handleUnitChange('lbs')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${unit === 'lbs' ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white'}`}
              >lbs</button>
            </div>
          )}
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
          {categoryDefs.map(def => {
            const displayUnit = def.unit === 'lbs' ? unit : def.unit
            return (
              <div key={def.name} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <span className="flex-1 text-sm text-zinc-200">{def.name}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={values[def.name] ?? ''}
                    onChange={e => setValue(def.name, e.target.value)}
                    placeholder={def.unit === 'tempo' ? 'ex: 1:45' : def.unit === 'reps' ? 'ex: 15' : unit === 'kg' ? 'ex: 90' : 'ex: 200'}
                    className="w-28 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white text-right focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-xs text-zinc-500 w-8">{displayUnit}</span>
                </div>
              </div>
            )
          })}
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
