'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

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

const TYPE_DESC: Record<GoalType, string> = {
  curto_prazo: 'Metas para os próximos meses',
  longo_prazo: 'Metas para o futuro',
}

export default function MeusObjetivosPage() {
  const { status } = useSession()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<GoalType>('curto_prazo')
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  async function load() {
    const res = await fetch('/api/goals')
    setGoals(await res.json())
    setLoading(false)
  }

  useEffect(() => { if (status === 'authenticated') load() }, [status])

  async function handleAdd() {
    if (!newText.trim()) return
    setAdding(true)
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: activeType, description: newText.trim() }),
    })
    setNewText('')
    setAdding(false)
    load()
  }

  async function handleToggle(id: number, completed: boolean) {
    await fetch(`/api/goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !completed }),
    })
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !completed } : g))
  }

  async function handleEdit(id: number) {
    if (!editText.trim()) return
    await fetch(`/api/goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: editText.trim() }),
    })
    setEditingId(null)
    load()
  }

  async function handleDelete(id: number) {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const filtered = goals.filter(g => g.type === activeType)
  const done = filtered.filter(g => g.completed).length

  if (status === 'loading' || loading) {
    return <main className="min-h-screen bg-zinc-950 flex items-center justify-center"><p className="text-zinc-400">Carregando...</p></main>
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black">Meus Objetivos</h1>
          <p className="text-zinc-400 text-sm mt-1">Defina suas metas e acompanhe seu progresso</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(['curto_prazo', 'longo_prazo'] as GoalType[]).map(type => {
            const count = goals.filter(g => g.type === type && !g.completed).length
            return (
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
                {count > 0 && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeType === type ? 'bg-orange-600' : 'bg-zinc-700'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <p className="text-zinc-500 text-xs mb-4">{TYPE_DESC[activeType]}</p>

        {/* Input novo objetivo */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Adicionar objetivo..."
            className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-zinc-600"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newText.trim()}
            className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-40"
          >
            +
          </button>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-600 text-sm">Nenhum objetivo de {TYPE_LABELS[activeType].toLowerCase()} ainda.</p>
            <p className="text-zinc-700 text-xs mt-1">Digite acima para adicionar.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {filtered.filter(g => !g.completed).map(g => (
                <GoalItem
                  key={g.id}
                  goal={g}
                  editing={editingId === g.id}
                  editText={editText}
                  onToggle={() => handleToggle(g.id, g.completed)}
                  onStartEdit={() => { setEditingId(g.id); setEditText(g.description) }}
                  onEditChange={setEditText}
                  onEditSave={() => handleEdit(g.id)}
                  onEditCancel={() => setEditingId(null)}
                  onDelete={() => handleDelete(g.id)}
                />
              ))}
            </div>

            {filtered.some(g => g.completed) && (
              <>
                <p className="text-zinc-600 text-xs font-semibold uppercase tracking-wider mt-6 mb-3">
                  Concluídos ({done})
                </p>
                <div className="space-y-2">
                  {filtered.filter(g => g.completed).map(g => (
                    <GoalItem
                      key={g.id}
                      goal={g}
                      editing={false}
                      editText=""
                      onToggle={() => handleToggle(g.id, g.completed)}
                      onStartEdit={() => {}}
                      onEditChange={() => {}}
                      onEditSave={() => {}}
                      onEditCancel={() => {}}
                      onDelete={() => handleDelete(g.id)}
                    />
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

function GoalItem({ goal, editing, editText, onToggle, onStartEdit, onEditChange, onEditSave, onEditCancel, onDelete }: {
  goal: Goal
  editing: boolean
  editText: string
  onToggle: () => void
  onStartEdit: () => void
  onEditChange: (v: string) => void
  onEditSave: () => void
  onEditCancel: () => void
  onDelete: () => void
}) {
  return (
    <div className={`flex items-start gap-3 bg-zinc-900 border rounded-xl px-4 py-3 group transition-colors ${goal.completed ? 'border-zinc-800 opacity-60' : 'border-zinc-800 hover:border-zinc-700'}`}>
      <button
        onClick={onToggle}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 transition-colors flex items-center justify-center ${goal.completed ? 'bg-orange-500 border-orange-500' : 'border-zinc-600 hover:border-orange-500'}`}
      >
        {goal.completed && <span className="text-white text-xs">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={editText}
              onChange={e => onEditChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onEditSave(); if (e.key === 'Escape') onEditCancel() }}
              className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button onClick={onEditSave} className="text-xs text-orange-400 font-semibold hover:text-orange-300">Salvar</button>
            <button onClick={onEditCancel} className="text-xs text-zinc-500 hover:text-zinc-300">Cancelar</button>
          </div>
        ) : (
          <p className={`text-sm ${goal.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
            {goal.description}
          </p>
        )}
      </div>

      {!editing && !goal.completed && (
        <button onClick={onStartEdit} className="text-zinc-600 hover:text-zinc-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          ✏️
        </button>
      )}
      <button onClick={onDelete} className="text-zinc-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        ✕
      </button>
    </div>
  )
}
