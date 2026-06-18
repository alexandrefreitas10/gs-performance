'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ExerciseInput {
  name: string
  sets: string
  reps: string
  load_suggested: string
  notes: string
}

interface PartInput {
  title: string
  type: string
  description: string
  time_cap: string
  scoring_type: string
  exercises: ExerciseInput[]
}

const emptyExercise = (): ExerciseInput => ({ name: '', sets: '', reps: '', load_suggested: '', notes: '' })
const emptyPart = (): PartInput => ({ title: '', type: '', description: '', time_cap: '', scoring_type: '', exercises: [emptyExercise()] })

export default function NovoTreinoPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [parts, setParts] = useState<PartInput[]>([emptyPart()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updatePart(pi: number, field: keyof PartInput, value: string) {
    setParts(prev => prev.map((p, i) => i === pi ? { ...p, [field]: value } : p))
  }

  function updateExercise(pi: number, ei: number, field: keyof ExerciseInput, value: string) {
    setParts(prev => prev.map((p, i) => i === pi ? {
      ...p,
      exercises: p.exercises.map((e, j) => j === ei ? { ...e, [field]: value } : e)
    } : p))
  }

  function addPart() {
    setParts(prev => [...prev, emptyPart()])
  }

  function removePart(pi: number) {
    setParts(prev => prev.filter((_, i) => i !== pi))
  }

  function addExercise(pi: number) {
    setParts(prev => prev.map((p, i) => i === pi ? { ...p, exercises: [...p.exercises, emptyExercise()] } : p))
  }

  function removeExercise(pi: number, ei: number) {
    setParts(prev => prev.map((p, i) => i === pi ? { ...p, exercises: p.exercises.filter((_, j) => j !== ei) } : p))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        date: date || undefined,
        notes,
        parts: parts.map(p => ({
          ...p,
          time_cap: p.time_cap ? Number(p.time_cap) : undefined,
          exercises: p.exercises.map(e => ({
            ...e,
            sets: e.sets ? Number(e.sets) : undefined,
          })),
        })),
      }),
    })
    if (res.ok) {
      router.push('/treinos')
    } else {
      const d = await res.json()
      setError(d.error)
      setSaving(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="text-zinc-400 hover:text-white text-sm">← Voltar</button>
        <h1 className="text-2xl font-black text-white">Novo treino</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados gerais */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">Informações gerais</h2>
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Título *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Treino A - Força + Condicionamento"
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Data</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Observações gerais</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
        </div>

        {/* Partes do treino */}
        {parts.map((part, pi) => (
          <div key={pi} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">Parte {pi + 1}</h2>
              {parts.length > 1 && (
                <button type="button" onClick={() => removePart(pi)} className="text-red-400 hover:text-red-300 text-xs">
                  Remover parte
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Nome da parte *</label>
                <input
                  value={part.title}
                  onChange={e => updatePart(pi, 'title', e.target.value)}
                  placeholder="Ex: Aquecimento, WOD, Força..."
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Tipo</label>
                <select
                  value={part.type}
                  onChange={e => updatePart(pi, 'type', e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Selecionar...</option>
                  <option value="aquecimento">Aquecimento</option>
                  <option value="amrap">AMRAP</option>
                  <option value="emom">EMOM</option>
                  <option value="fortime">For Time</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Critério de ranking</label>
              <div className="flex gap-2">
                {[
                  { value: 'menor_tempo', label: '⏱ Menor tempo' },
                  { value: 'max_reps', label: '🔁 Máx. repetições' },
                  { value: 'maior_carga', label: '🏋️ Maior carga' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updatePart(pi, 'scoring_type', part.scoring_type === opt.value ? '' : opt.value)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      part.scoring_type === opt.value
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-zinc-600 text-xs mt-1">Selecione para ativar ranking nessa parte. Deixe em branco para partes sem ranking (aquecimento, etc.)</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Descrição / Instruções</label>
                <textarea
                  value={part.description}
                  onChange={e => updatePart(pi, 'description', e.target.value)}
                  rows={2}
                  placeholder="Ex: 3 rounds de..."
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Time cap (min)</label>
                <input
                  type="number"
                  value={part.time_cap}
                  onChange={e => updatePart(pi, 'time_cap', e.target.value)}
                  placeholder="Ex: 20"
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Exercícios */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-3">Exercícios</label>
              <div className="space-y-3">
                {part.exercises.map((ex, ei) => (
                  <div key={ei} className="bg-zinc-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 text-xs font-semibold">Exercício {ei + 1}</span>
                      {part.exercises.length > 1 && (
                        <button type="button" onClick={() => removeExercise(pi, ei)} className="text-red-400 hover:text-red-300 text-xs">
                          Remover
                        </button>
                      )}
                    </div>
                    <div>
                      <input
                        value={ex.name}
                        onChange={e => updateExercise(pi, ei, 'name', e.target.value)}
                        placeholder="Nome do exercício *"
                        className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        value={ex.sets}
                        onChange={e => updateExercise(pi, ei, 'sets', e.target.value)}
                        type="number"
                        placeholder="Séries"
                        className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <input
                        value={ex.reps}
                        onChange={e => updateExercise(pi, ei, 'reps', e.target.value)}
                        placeholder="Reps (ex: 10-8-6)"
                        className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <input
                        value={ex.load_suggested}
                        onChange={e => updateExercise(pi, ei, 'load_suggested', e.target.value)}
                        placeholder="Carga (ex: 60kg)"
                        className="px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <input
                      value={ex.notes}
                      onChange={e => updateExercise(pi, ei, 'notes', e.target.value)}
                      placeholder="Observações"
                      className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addExercise(pi)}
                className="mt-3 text-orange-400 hover:text-orange-300 text-sm font-semibold"
              >
                + Adicionar exercício
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addPart}
          className="w-full py-3 border-2 border-dashed border-zinc-700 hover:border-orange-500 text-zinc-400 hover:text-orange-400 rounded-2xl text-sm font-semibold transition-colors"
        >
          + Adicionar parte do treino
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black rounded-xl text-sm transition-colors"
        >
          {saving ? 'Salvando...' : 'Salvar treino'}
        </button>
      </form>
    </main>
  )
}
