'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Exercise {
  id: number
  name: string
  sets: number | null
  reps: string
  load_suggested: string
  notes: string
}

interface Part {
  id: number
  title: string
  type: string
  description: string
  time_cap: number | null
  exercises: Exercise[]
}

interface Workout {
  id: number
  title: string
  date: string | null
  notes: string
  parts: Part[]
}

interface Athlete {
  id: number
  name: string
  username: string
}

interface Result {
  id: number
  part_id: number
  completed: boolean
  rpe: number | null
  result_value: string
  notes: string
  video_s3_key: string
  video_name: string
  admin_feedback: string
}

interface AdminResult {
  id: number
  part_id: number
  part_title: string
  athlete_name: string
  completed: boolean
  rpe: number | null
  result_value: string
  notes: string
  video_s3_key: string
  video_name: string
  admin_feedback: string
}

const TYPE_LABELS: Record<string, string> = {
  aquecimento: 'Aquecimento',
  forca: 'Força',
  wod: 'WOD',
  amrap: 'AMRAP',
  emom: 'EMOM',
  fortime: 'For Time',
  alongamento: 'Alongamento',
  outro: 'Outro',
}

const RPE_LABELS: Record<number, string> = {
  1: '1 — Muito leve',
  2: '2 — Leve',
  3: '3 — Moderado leve',
  4: '4 — Moderado',
  5: '5 — Moderado intenso',
  6: '6 — Intenso',
  7: '7 — Muito intenso',
  8: '8 — Difícil',
  9: '9 — Muito difícil',
  10: '10 — Máximo',
}

function formatDate(d: string | null) {
  if (!d) return null
  const dateStr = d.includes('T') ? d : d + 'T12:00:00'
  const parsed = new Date(dateStr)
  if (isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

export default function WorkoutDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.is_admin

  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)

  // Admin state
  const [assignees, setAssignees] = useState<Athlete[]>([])
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([])
  const [showAssign, setShowAssign] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [adminResults, setAdminResults] = useState<AdminResult[]>([])

  // Athlete state
  const [myResults, setMyResults] = useState<Record<number, Result>>({})
  const [drafts, setDrafts] = useState<Record<number, { result_value: string; rpe: number | null; notes: string; completed: boolean }>>({})
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [saved, setSaved] = useState<Record<number, boolean>>({})
  const [uploadingVideo, setUploadingVideo] = useState<Record<number, boolean>>({})
  const [uploadError, setUploadError] = useState<Record<number, string>>({})
  const [deletingVideo, setDeletingVideo] = useState<Record<number, boolean>>({})
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<number, string>>({})
  const [savingFeedback, setSavingFeedback] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetch(`/api/workouts/${id}`)
      .then(r => r.json())
      .then(d => { setWorkout(d); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!id || isAdmin === undefined) return
    fetch(`/api/workouts/${id}/results`).then(r => r.json()).then(data => {
      if (isAdmin) {
        setAdminResults(data)
      } else {
        const map: Record<number, Result> = {}
        data.forEach((r: Result) => { map[r.part_id] = r })
        setMyResults(map)
      }
    })
    if (isAdmin) {
      fetch(`/api/workouts/${id}/assignments`).then(r => r.json()).then(setAssignees)
      fetch('/api/athletes').then(r => r.json()).then(setAllAthletes)
    }
  }, [id, isAdmin])

  function initDraft(partId: number) {
    if (drafts[partId]) return
    const existing = myResults[partId]
    setDrafts(prev => ({
      ...prev,
      [partId]: {
        result_value: existing?.result_value ?? '',
        rpe: existing?.rpe ?? null,
        notes: existing?.notes ?? '',
        completed: existing?.completed ?? false,
      }
    }))
  }

  async function handleSave(partId: number) {
    const draft = drafts[partId]
    if (!draft) return
    setSaving(prev => ({ ...prev, [partId]: true }))
    const res = await fetch(`/api/workouts/${id}/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partId, ...draft }),
    })
    if (res.ok) {
      const result = await res.json()
      setMyResults(prev => ({ ...prev, [partId]: result }))
      setSaved(prev => ({ ...prev, [partId]: true }))
      setTimeout(() => setSaved(prev => ({ ...prev, [partId]: false })), 2000)
    }
    setSaving(prev => ({ ...prev, [partId]: false }))
  }

  async function handleVideoUpload(partId: number, file: File) {
    const result = myResults[partId]
    if (!result) return
    setUploadingVideo(prev => ({ ...prev, [partId]: true }))
    setUploadError(prev => ({ ...prev, [partId]: '' }))
    const formData = new FormData()
    formData.append('video', file)
    try {
      const res = await fetch(`/api/results/${result.id}/video`, { method: 'POST', body: formData })
      if (res.ok) {
        setMyResults(prev => ({ ...prev, [partId]: { ...prev[partId], video_s3_key: 'uploaded', video_name: file.name } }))
      } else {
        const data = await res.json().catch(() => ({}))
        setUploadError(prev => ({ ...prev, [partId]: data.error || 'Erro ao enviar vídeo. Tente novamente.' }))
      }
    } catch {
      setUploadError(prev => ({ ...prev, [partId]: 'Erro de conexão. Verifique sua internet e tente novamente.' }))
    }
    setUploadingVideo(prev => ({ ...prev, [partId]: false }))
  }

  async function handleVideoDelete(partId: number) {
    const result = myResults[partId]
    if (!result) return
    setDeletingVideo(prev => ({ ...prev, [partId]: true }))
    await fetch(`/api/results/${result.id}/video`, { method: 'DELETE' })
    setMyResults(prev => ({ ...prev, [partId]: { ...prev[partId], video_s3_key: '', video_name: '' } }))
    setDeletingVideo(prev => ({ ...prev, [partId]: false }))
  }

  async function handleVideoDownload(resultId: number, mode: 'view' | 'download') {
    const res = await fetch(`/api/results/${resultId}/video?mode=${mode}`)
    const { url } = await res.json()
    window.open(url, '_blank')
  }

  async function handleFeedbackSave(resultId: number) {
    setSavingFeedback(prev => ({ ...prev, [resultId]: true }))
    await fetch(`/api/results/${resultId}/feedback`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: feedbackDrafts[resultId] ?? '' }),
    })
    setAdminResults(prev => prev.map(r => r.id === resultId ? { ...r, admin_feedback: feedbackDrafts[resultId] ?? '' } : r))
    setSavingFeedback(prev => ({ ...prev, [resultId]: false }))
  }

  async function handleAssign() {
    if (selected.length === 0) return
    await fetch(`/api/workouts/${id}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: selected }),
    })
    const updated = await fetch(`/api/workouts/${id}/assignments`).then(r => r.json())
    setAssignees(updated)
    setSelected([])
    setShowAssign(false)
  }

  async function handleRemoveAssignee(userId: number) {
    await fetch(`/api/workouts/${id}/assignments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    setAssignees(prev => prev.filter(a => a.id !== userId))
  }

  const unassigned = allAthletes.filter(a => !assignees.find(x => x.id === a.id))

  if (loading) return <main className="max-w-3xl mx-auto px-4 py-8"><p className="text-zinc-500">Carregando...</p></main>
  if (!workout) return <main className="max-w-3xl mx-auto px-4 py-8"><p className="text-zinc-500">Treino não encontrado.</p></main>

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-zinc-400 hover:text-white text-sm">← Voltar</button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">{workout.title}</h1>
        {workout.date && <p className="text-orange-400 text-sm font-semibold mt-1 capitalize">{formatDate(workout.date)}</p>}
        {workout.notes && <p className="text-zinc-400 text-sm mt-2">{workout.notes}</p>}
      </div>

      {/* Painel de atribuição (admin) */}
      {isAdmin && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-sm">Atletas atribuídos</h2>
            {unassigned.length > 0 && (
              <button onClick={() => setShowAssign(v => !v)} className="text-orange-400 hover:text-orange-300 text-xs font-semibold">
                {showAssign ? 'Cancelar' : '+ Atribuir atletas'}
              </button>
            )}
          </div>
          {assignees.length === 0 && !showAssign && <p className="text-zinc-600 text-xs">Nenhum atleta atribuído.</p>}
          {assignees.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {assignees.map(a => (
                <div key={a.id} className="flex items-center gap-1.5 bg-zinc-800 rounded-full px-3 py-1">
                  <span className="text-white text-xs font-semibold">{a.name}</span>
                  <button onClick={() => handleRemoveAssignee(a.id)} className="text-zinc-500 hover:text-red-400 text-xs">×</button>
                </div>
              ))}
            </div>
          )}
          {showAssign && (
            <div className="border-t border-zinc-800 pt-3 space-y-2">
              {unassigned.map(a => (
                <label key={a.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selected.includes(a.id)} onChange={() => setSelected(prev => prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id])} className="accent-orange-500" />
                  <span className="text-white text-sm">{a.name}</span>
                  <span className="text-zinc-500 text-xs">@{a.username}</span>
                </label>
              ))}
              <button onClick={handleAssign} disabled={selected.length === 0} className="mt-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition-colors">
                Confirmar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Partes do treino */}
      <div className="space-y-6">
        {workout.parts.map((part, pi) => (
          <div key={part.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-zinc-500 text-xs font-semibold">Parte {pi + 1}</span>
                {part.type && <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full">{TYPE_LABELS[part.type] ?? part.type}</span>}
                {part.time_cap && <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full">{part.time_cap} min</span>}
              </div>
              <h2 className="text-white font-bold text-lg">{part.title}</h2>
            </div>

            {part.description && <p className="text-zinc-400 text-sm mb-4 whitespace-pre-wrap">{part.description}</p>}

            {part.exercises.length > 0 && (
              <div className="space-y-2 mb-5">
                {part.exercises.map(ex => (
                  <div key={ex.id} className="bg-zinc-800 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold text-sm">{ex.name}</span>
                      <div className="flex gap-3 text-zinc-400 text-xs">
                        {ex.sets && <span>{ex.sets}x</span>}
                        {ex.reps && <span>{ex.reps}</span>}
                        {ex.load_suggested && <span className="text-orange-400 font-semibold">{ex.load_suggested}</span>}
                      </div>
                    </div>
                    {ex.notes && <p className="text-zinc-500 text-xs mt-1">{ex.notes}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Vídeos dos atletas por parte — admin */}
            {isAdmin && (() => {
              const partResults = adminResults.filter(r => r.part_id === part.id)
              const withVideo = partResults.filter(r => r.video_s3_key)
              if (withVideo.length === 0) return null
              return (
                <div className="border-t border-zinc-800 pt-4 mt-2">
                  <p className="text-xs font-semibold text-zinc-400 mb-3">📹 Vídeos dos atletas</p>
                  <div className="space-y-3">
                    {withVideo.map(r => (
                      <div key={r.id} className="bg-zinc-800 rounded-xl px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-semibold text-sm">{r.athlete_name}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleVideoDownload(r.id, 'view')} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">Assistir</button>
                            <button onClick={() => handleVideoDownload(r.id, 'download')} className="text-xs text-zinc-400 hover:text-white font-semibold">Baixar</button>
                          </div>
                        </div>
                        <textarea
                          rows={2}
                          value={feedbackDrafts[r.id] ?? r.admin_feedback ?? ''}
                          onChange={e => setFeedbackDrafts(prev => ({ ...prev, [r.id]: e.target.value }))}
                          placeholder="Escreva um feedback sobre o movimento..."
                          className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none placeholder:text-zinc-500"
                        />
                        <button
                          onClick={() => handleFeedbackSave(r.id)}
                          disabled={savingFeedback[r.id]}
                          className="mt-1.5 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {savingFeedback[r.id] ? 'Salvando...' : 'Salvar feedback'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Registro de resultado — atleta */}
            {!isAdmin && (
              <div className="border-t border-zinc-800 pt-4">
                {!drafts[part.id] && (
                  <button
                    onClick={() => initDraft(part.id)}
                    className={`text-sm font-semibold transition-colors ${myResults[part.id] ? 'text-green-400 hover:text-orange-400' : 'text-orange-400 hover:text-orange-300'}`}
                  >
                    {myResults[part.id] ? '✓ Resultado registrado — editar' : '+ Registrar resultado'}
                  </button>
                )}

                {drafts[part.id] && (
                  <div className="space-y-3">
                    <p className="text-white text-sm font-bold">Seu resultado</p>

                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Resultado (tempo, rounds, peso...)</label>
                      <input
                        value={drafts[part.id].result_value}
                        onChange={e => setDrafts(prev => ({ ...prev, [part.id]: { ...prev[part.id], result_value: e.target.value } }))}
                        placeholder="Ex: 18:42 / 5 rounds / 80kg"
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400 block mb-2">PSE — Percepção de Esforço: <span className="text-orange-400 font-bold">{drafts[part.id].rpe ?? '—'}</span></label>
                      <div className="flex gap-1 flex-wrap">
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setDrafts(prev => ({ ...prev, [part.id]: { ...prev[part.id], rpe: n } }))}
                            title={RPE_LABELS[n]}
                            className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                              drafts[part.id].rpe === n
                                ? 'bg-orange-500 text-white'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      {drafts[part.id].rpe && <p className="text-zinc-500 text-xs mt-1">{RPE_LABELS[drafts[part.id].rpe!]}</p>}
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Observações</label>
                      <input
                        value={drafts[part.id].notes}
                        onChange={e => setDrafts(prev => ({ ...prev, [part.id]: { ...prev[part.id], notes: e.target.value } }))}
                        placeholder="Como foi? Alguma dificuldade?"
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={drafts[part.id].completed}
                          onChange={e => setDrafts(prev => ({ ...prev, [part.id]: { ...prev[part.id], completed: e.target.checked } }))}
                          className="accent-orange-500"
                        />
                        <span className="text-white text-sm">Concluído</span>
                      </label>
                    </div>

                    <button
                      onClick={() => handleSave(part.id)}
                      disabled={saving[part.id]}
                      className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors"
                    >
                      {saving[part.id] ? 'Salvando...' : saved[part.id] ? '✓ Salvo!' : 'Salvar resultado'}
                    </button>
                  </div>
                )}

                {/* Vídeo */}
                {myResults[part.id] && (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <p className="text-xs font-semibold text-zinc-400 mb-2">📹 Vídeo do movimento</p>
                    {myResults[part.id].video_s3_key ? (
                      <div className="bg-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                        <span className="text-zinc-300 text-xs truncate">{myResults[part.id].video_name || 'Vídeo enviado'}</span>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleVideoDownload(myResults[part.id].id, 'view')} className="text-xs text-blue-400 hover:text-blue-300 font-semibold">Assistir</button>
                          <button onClick={() => handleVideoDownload(myResults[part.id].id, 'download')} className="text-xs text-zinc-400 hover:text-white font-semibold">Baixar</button>
                          <button onClick={() => handleVideoDelete(part.id)} disabled={deletingVideo[part.id]} className="text-xs text-red-400 hover:text-red-300 font-semibold disabled:opacity-50">
                            {deletingVideo[part.id] ? '...' : 'Excluir'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <label className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploadingVideo[part.id] ? 'opacity-50 pointer-events-none border-zinc-700' : uploadError[part.id] ? 'border-red-500' : 'border-zinc-700 hover:border-orange-500'}`}>
                          <input type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(part.id, f) }} />
                          <span className={`text-sm ${uploadingVideo[part.id] ? 'text-orange-400' : 'text-zinc-400'}`}>
                            {uploadingVideo[part.id] ? '⏳ Enviando, aguarde...' : '+ Enviar vídeo'}
                          </span>
                        </label>
                        {uploadError[part.id] && (
                          <p className="text-red-400 text-xs mt-1">{uploadError[part.id]}</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Feedback do admin */}
                {myResults[part.id]?.admin_feedback && (
                  <div className="mt-3 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-orange-400 mb-1">💬 Feedback do Guilherme</p>
                    <p className="text-zinc-300 text-sm whitespace-pre-wrap">{myResults[part.id].admin_feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Resultados dos atletas — admin */}
      {isAdmin && adminResults.length > 0 && (
        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-white font-bold mb-4">Resultados dos atletas</h2>
          <div className="space-y-3">
            {adminResults.map((r, i) => (
              <div key={i} className="bg-zinc-800 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-semibold text-sm">{r.athlete_name}</span>
                  <div className="flex items-center gap-2">
                    {r.rpe && <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full">PSE {r.rpe}</span>}
                    {r.completed && <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">✓</span>}
                  </div>
                </div>
                <p className="text-zinc-400 text-xs">{r.part_title}</p>
                {r.result_value && <p className="text-white text-sm mt-1 font-mono">{r.result_value}</p>}
                {r.notes && <p className="text-zinc-500 text-xs mt-0.5 italic">{r.notes}</p>}

                {r.video_s3_key && <span className="text-zinc-500 text-xs mt-1 block">📹 Vídeo enviado</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
