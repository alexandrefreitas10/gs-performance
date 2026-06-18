'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function CadastroForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading')
  const [invalidReason, setInvalidReason] = useState('')
  const [form, setForm] = useState({ name: '', username: '', password: '', confirm: '', gender: '', birth_date: '', email: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) { setStatus('invalid'); setInvalidReason('Link inválido.'); return }
    fetch(`/api/invite/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.valid) setStatus('valid')
        else { setStatus('invalid'); setInvalidReason(d.reason) }
      })
      .catch(() => { setStatus('invalid'); setInvalidReason('Erro ao verificar link.') })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) { setError('As senhas não coincidem.'); return }
    if (form.password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    setSubmitting(true)
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name: form.name, username: form.username, password: form.password, gender: form.gender, birth_date: form.birth_date, email: form.email, phone: form.phone }),
    })
    const data = await res.json()
    if (res.ok) { setDone(true) }
    else { setError(data.error); setSubmitting(false) }
  }

  const inputCls = 'w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500'

  if (status === 'loading') {
    return <p className="text-zinc-400 text-sm text-center">Verificando link...</p>
  }

  if (status === 'invalid') {
    return (
      <div className="text-center">
        <p className="text-red-400 font-semibold mb-2">{invalidReason}</p>
        <p className="text-zinc-500 text-sm">Solicite um novo link ao seu treinador.</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">🎉</div>
        <p className="text-white font-bold text-lg">Conta criada com sucesso!</p>
        <p className="text-zinc-400 text-sm">Você já pode fazer login com suas credenciais.</p>
        <button onClick={() => router.push('/login')} className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors">
          Ir para o login
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Nome completo *</label>
          <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} required />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Usuário (login) *</label>
          <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g, '') }))} className={inputCls} required />
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Senha *</label>
          <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className={inputCls} required />
        </div>
        <div>
          <label className="text-xs font-semibold text-zinc-400 block mb-1.5">Confirmar senha *</label>
          <input type="password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} className={inputCls} required />
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
      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
      <button type="submit" disabled={submitting} className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50">
        {submitting ? 'Criando conta...' : 'Criar minha conta'}
      </button>
    </form>
  )
}

export default function CadastroPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="GS Performance" className="h-24 w-24 object-contain rounded-2xl bg-white p-1.5" />
          </div>
          <h1 className="text-2xl font-black text-orange-500 tracking-tight">GS Performance</h1>
          <p className="text-zinc-400 text-sm mt-1">Crie sua conta de atleta</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <Suspense fallback={<p className="text-zinc-400 text-sm text-center">Carregando...</p>}>
            <CadastroForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
