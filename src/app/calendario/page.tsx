'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Competition {
  id: number
  name: string
  date: string
  end_date: string | null
  location: string
  notes: string
}

const EMPTY_FORM = { name: '', date: '', end_date: '', location: '', notes: '' }

function formatDate(d: string) {
  const dateStr = d.includes('T') ? d : d + 'T12:00:00'
  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) return d
  return parsed.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

function isPast(c: Competition) {
  const ref = c.end_date ?? c.date
  const dateStr = ref.includes('T') ? ref : ref + 'T23:59:59'
  return new Date(dateStr) < new Date()
}

function formatDateRange(start: string, end: string | null) {
  const s = formatDate(start)
  if (!end) return s
  const e = formatDate(end)
  return `${s} → ${e}`
}

export default function CalendarioPage() {
  const { data: session, status } = useSession()
  const isAdmin = (session?.user as any)?.is_admin === true
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Competition | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/competitions')
    setCompetitions(await res.json())
    setLoading(false)
  }

  useEffect(() => { if (status !== 'loading') load() }, [status])

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(c: Competition) {
    setEditing(c)
    setForm({ name: c.name, date: c.date.slice(0, 10), end_date: c.end_date ? c.end_date.slice(0, 10) : '', location: c.location, notes: c.notes })
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editing) {
      await fetch(`/api/competitions/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Remover "${name}" do calendário?`)) return
    await fetch(`/api/competitions/${id}`, { method: 'DELETE' })
    load()
  }

  const upcoming = competitions.filter(c => !isPast(c))
  const past = competitions.filter(c => isPast(c))

  if (status === 'loading' || loading) {
    return <main className="min-h-screen bg-zinc-950 flex items-center justify-center"><p className="text-zinc-400">Carregando...</p></main>
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Calendário de Competições</h1>
          <p className="text-zinc-400 text-sm mt-1">{upcoming.length} próxima{upcoming.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button
            onClick={openNew}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors"
          >
            + Adicionar
          </button>
        )}
      </div>

      {/* Formulário */}
      {isAdmin && showForm && (
        <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8 space-y-4">
          <h2 className="text-white font-bold">{editing ? 'Editar competição' : 'Nova competição'}</h2>
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Nome da competição</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="ex: CrossFit Open 2025"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Data de início</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Data de término</label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Local</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="ex: São Paulo, SP"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Observações</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Informações adicionais..."
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Próximas */}
      {upcoming.length === 0 && past.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-500 text-sm">Nenhuma competição cadastrada ainda.</p>
          {isAdmin && <p className="text-zinc-600 text-xs mt-1">Clique em "+ Adicionar" para incluir competições no calendário.</p>}
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3 mb-8">
              {upcoming.map(c => (
                <div key={c.id} className="bg-zinc-900 border border-orange-500/30 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                        <h2 className="text-white font-bold">{c.name}</h2>
                      </div>
                      <p className="text-orange-400 text-sm font-semibold ml-4">{formatDateRange(c.date, c.end_date)}</p>
                      {c.location && <p className="text-zinc-400 text-xs mt-1 ml-4">📍 {c.location}</p>}
                      {c.notes && <p className="text-zinc-500 text-xs mt-2 ml-4">{c.notes}</p>}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => openEdit(c)} className="px-3 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Editar</button>
                        <button onClick={() => handleDelete(c.id, c.name)} className="px-3 py-1.5 text-xs font-semibold text-red-400 bg-zinc-800 hover:bg-red-950 rounded-lg transition-colors">Remover</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {past.length > 0 && (
            <>
              <p className="text-zinc-600 text-xs font-semibold uppercase tracking-wider mb-3">Anteriores</p>
              <div className="space-y-2">
                {past.map(c => (
                  <div key={c.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 opacity-60">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-zinc-400 font-semibold text-sm">{c.name}</h2>
                        <p className="text-zinc-600 text-xs mt-0.5">{formatDateRange(c.date, c.end_date)}</p>
                        {c.location && <p className="text-zinc-600 text-xs mt-0.5">📍 {c.location}</p>}
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleDelete(c.id, c.name)} className="px-3 py-1.5 text-xs font-semibold text-red-400 bg-zinc-800 hover:bg-red-950 rounded-lg transition-colors opacity-100">Remover</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </main>
  )
}
