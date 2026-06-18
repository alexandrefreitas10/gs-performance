'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Athlete {
  id: number
  username: string
  name: string
  gender: string
  birth_date: string | null
  email: string
  phone: string
  created_at: string
}

const emptyForm = { name: '', username: '', password: '', gender: '', birth_date: '', email: '', phone: '' }

function calcAge(birth_date: string | null): string {
  if (!birth_date) return ''
  const d = birth_date.includes('T') ? birth_date : birth_date + 'T12:00:00'
  const age = Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 24 * 3600 * 1000))
  return isNaN(age) ? '' : `${age} anos`
}

export default function AtletasPage() {
  const router = useRouter()
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [resetId, setResetId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ name: '', gender: '', birth_date: '', email: '', phone: '' })
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)

  async function load() {
    const res = await fetch('/api/athletes')
    if (res.status === 401) { router.push('/dashboard'); return }
    setAthletes(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleGenerateInvite() {
    setInviteLoading(true)
    setInviteLink(null)
    setInviteCopied(false)
    const res = await fetch('/api/invite', { method: 'POST' })
    const data = await res.json()
    setInviteLink(data.link)
    setInviteLoading(false)
  }

  function copyInvite() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const res = await fetch('/api/athletes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm(emptyForm)
      setShowForm(false)
      load()
    } else {
      const d = await res.json()
      setFormError(d.error)
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Excluir ${name}? Esta ação não pode ser desfeita.`)) return
    await fetch(`/api/athletes/${id}`, { method: 'DELETE' })
    load()
  }

  async function handleResetPassword(id: number) {
    if (!newPassword) return
    await fetch(`/api/athletes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    })
    setResetId(null)
    setNewPassword('')
  }

  function openEdit(a: Athlete) {
    setEditId(a.id)
    const bd = a.birth_date ? (a.birth_date.includes('T') ? a.birth_date.split('T')[0] : a.birth_date) : ''
    setEditForm({ name: a.name, gender: a.gender ?? '', birth_date: bd, email: a.email ?? '', phone: a.phone ?? '' })
  }

  async function handleSaveEdit(id: number) {
    await fetch(`/api/athletes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditId(null)
    load()
  }

  const inputCls = 'w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500'

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Atletas</h1>
          <p className="text-zinc-400 text-sm mt-1">{athletes.length} atleta{athletes.length !== 1 ? 's' : ''} cadastrado{athletes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateInvite}
            disabled={inviteLoading}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {inviteLoading ? 'Gerando...' : '🔗 Link de convite'}
          </button>
          <button
            onClick={() => { setShowForm(v => !v); setFormError(null) }}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors"
          >
            {showForm ? 'Cancelar' : '+ Novo atleta'}
          </button>
        </div>
      </div>

      {inviteLink && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold text-zinc-400 mb-2">Link de convite gerado (válido por 7 dias):</p>
          <div className="flex flex-col gap-2">
            <input
              readOnly
              value={inviteLink}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-xs focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={copyInvite}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-xs transition-colors"
              >
                {inviteCopied ? '✓ Copiado' : 'Copiar'}
              </button>
              <button
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    navigator.share({ title: 'Convite GS Performance', text: 'Use este link para criar sua conta:', url: inviteLink! })
                  } else {
                    navigator.clipboard.writeText(inviteLink!)
                  }
                }}
                className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-lg text-xs transition-colors"
              >
                Compartilhar
              </button>
            </div>
          </div>
          <p className="text-zinc-500 text-xs mt-2">Envie este link para o atleta. Ele pode ser usado apenas uma vez.</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="text-white font-bold">Novo atleta</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Nome completo *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Usuário (login) *</label>
              <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Senha inicial *</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className={inputCls} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Sexo</label>
              <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className={inputCls}>
                <option value="">Não informado</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Data de nascimento</label>
              <input type="date" value={form.birth_date} onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">E-mail</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Telefone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
            </div>
          </div>

          {formError && <p className="text-red-400 text-xs">{formError}</p>}
          <button type="submit" className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors">
            Criar atleta
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-zinc-500 text-sm text-center py-12">Carregando...</p>
      ) : athletes.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-500 text-sm">Nenhum atleta cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {athletes.map(a => (
            <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold">{a.name}</p>
                    {a.gender === 'M' && <span className="px-2 py-0.5 text-xs font-bold bg-blue-500/20 text-blue-400 rounded-full">Masculino</span>}
                    {a.gender === 'F' && <span className="px-2 py-0.5 text-xs font-bold bg-pink-500/20 text-pink-400 rounded-full">Feminino</span>}
                  </div>
                  <p className="text-zinc-500 text-xs mt-0.5">@{a.username}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    {a.birth_date && <span className="text-zinc-500 text-xs">{calcAge(a.birth_date)}</span>}
                    {a.email && <span className="text-zinc-500 text-xs">{a.email}</span>}
                    {a.phone && <span className="text-zinc-500 text-xs">{a.phone}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap sm:justify-end">
                  <button onClick={() => router.push(`/atletas/${a.id}/benchmarks`)} className="px-3 py-1.5 text-xs font-semibold text-orange-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Benchmarks</button>
                  <button onClick={() => router.push(`/atletas/${a.id}/objetivos`)} className="px-3 py-1.5 text-xs font-semibold text-orange-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Objetivos</button>
                  <button onClick={() => editId === a.id ? setEditId(null) : openEdit(a)} className="px-3 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">
                    {editId === a.id ? 'Fechar' : 'Editar'}
                  </button>
                  <button onClick={() => { setResetId(resetId === a.id ? null : a.id); setNewPassword('') }} className="px-3 py-1.5 text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Resetar senha</button>
                  <button onClick={() => handleDelete(a.id, a.name)} className="px-3 py-1.5 text-xs font-semibold text-red-400 bg-zinc-800 hover:bg-red-950 rounded-lg transition-colors">Excluir</button>
                </div>
              </div>

              {editId === a.id && (
                <div className="mt-4 border-t border-zinc-800 pt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">Nome completo</label>
                    <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">Sexo</label>
                    <select value={editForm.gender} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))} className={inputCls}>
                      <option value="">Não informado</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">Data de nascimento</label>
                    <input type="date" value={editForm.birth_date} onChange={e => setEditForm(p => ({ ...p, birth_date: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">E-mail</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-400 block mb-1">Telefone</label>
                    <input type="tel" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="sm:col-span-2">
                    <button onClick={() => handleSaveEdit(a.id)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors">
                      Salvar alterações
                    </button>
                  </div>
                </div>
              )}

              {resetId === a.id && (
                <div className="mt-3 border-t border-zinc-800 pt-3 flex gap-2">
                  <input type="password" placeholder="Nova senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  <button onClick={() => handleResetPassword(a.id)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors">Salvar</button>
                  <button onClick={() => setResetId(null)} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors">Cancelar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
