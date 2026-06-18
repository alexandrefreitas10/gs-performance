'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Goal {
  id: number
  type: 'curto_prazo' | 'longo_prazo'
  description: string
  completed: boolean
}

interface Comment {
  id: number
  message: string
  author_name: string
  author_is_admin: boolean
  created_at: string
}

type GoalType = 'curto_prazo' | 'longo_prazo'

const TYPE_LABELS: Record<GoalType, string> = {
  curto_prazo: 'Curto Prazo',
  longo_prazo: 'Longo Prazo',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function AtletaObjetivosPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [athleteName, setAthleteName] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<GoalType>('curto_prazo')
  const [openComments, setOpenComments] = useState<Record<number, boolean>>({})
  const [comments, setComments] = useState<Record<number, Comment[]>>({})
  const [commentDraft, setCommentDraft] = useState<Record<number, string>>({})
  const [sendingComment, setSendingComment] = useState<Record<number, boolean>>({})

  useEffect(() => {
    Promise.all([
      fetch(`/api/goals/athlete/${id}`).then(r => r.json()),
      fetch('/api/athletes').then(r => r.json()),
    ]).then(([goalRows, athletes]) => {
      setGoals(goalRows)
      const athlete = athletes.find((a: { id: number; name: string }) => a.id === Number(id))
      if (athlete) setAthleteName(athlete.name)
      setLoading(false)
    })
  }, [id])

  async function toggleComments(goalId: number) {
    const nowOpen = !openComments[goalId]
    setOpenComments(prev => ({ ...prev, [goalId]: nowOpen }))
    if (nowOpen && !comments[goalId]) {
      const res = await fetch(`/api/goals/${goalId}/comments`)
      const data = await res.json()
      setComments(prev => ({ ...prev, [goalId]: data }))
    }
  }

  async function handleSendComment(goalId: number) {
    const msg = commentDraft[goalId]?.trim()
    if (!msg) return
    setSendingComment(prev => ({ ...prev, [goalId]: true }))
    const res = await fetch(`/api/goals/${goalId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    })
    const newComment = await res.json()
    setComments(prev => ({ ...prev, [goalId]: [...(prev[goalId] ?? []), newComment] }))
    setCommentDraft(prev => ({ ...prev, [goalId]: '' }))
    setSendingComment(prev => ({ ...prev, [goalId]: false }))
  }

  const filtered = goals.filter(g => g.type === activeType)
  const pending = filtered.filter(g => !g.completed)
  const done = filtered.filter(g => g.completed)

  if (loading) {
    return <main className="min-h-screen bg-zinc-950 flex items-center justify-center"><p className="text-zinc-400">Carregando...</p></main>
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button onClick={() => router.push('/atletas')} className="text-zinc-500 text-sm hover:text-white mb-3 block">
            ← Atletas
          </button>
          <h1 className="text-2xl font-black">{athleteName}</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Objetivos</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(['curto_prazo', 'longo_prazo'] as GoalType[]).map(type => (
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
              <span className="ml-2 text-xs opacity-70">
                {goals.filter(g => g.type === type).length}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-600 text-sm">Nenhum objetivo de {TYPE_LABELS[activeType].toLowerCase()} cadastrado.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {pending.map(g => (
                <AdminGoalCard
                  key={g.id}
                  goal={g}
                  commentsOpen={!!openComments[g.id]}
                  comments={comments[g.id]}
                  commentDraft={commentDraft[g.id] ?? ''}
                  sendingComment={!!sendingComment[g.id]}
                  onToggleComments={() => toggleComments(g.id)}
                  onCommentDraftChange={v => setCommentDraft(prev => ({ ...prev, [g.id]: v }))}
                  onSendComment={() => handleSendComment(g.id)}
                />
              ))}
            </div>

            {done.length > 0 && (
              <>
                <p className="text-zinc-600 text-xs font-semibold uppercase tracking-wider mt-6 mb-3">
                  Concluídos ({done.length})
                </p>
                <div className="space-y-3">
                  {done.map(g => (
                    <AdminGoalCard
                      key={g.id}
                      goal={g}
                      commentsOpen={!!openComments[g.id]}
                      comments={comments[g.id]}
                      commentDraft={commentDraft[g.id] ?? ''}
                      sendingComment={!!sendingComment[g.id]}
                      onToggleComments={() => toggleComments(g.id)}
                      onCommentDraftChange={v => setCommentDraft(prev => ({ ...prev, [g.id]: v }))}
                      onSendComment={() => handleSendComment(g.id)}
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

function AdminGoalCard({
  goal, commentsOpen, comments, commentDraft, sendingComment,
  onToggleComments, onCommentDraftChange, onSendComment,
}: {
  goal: Goal
  commentsOpen: boolean
  comments: Comment[] | undefined
  commentDraft: string
  sendingComment: boolean
  onToggleComments: () => void
  onCommentDraftChange: (v: string) => void
  onSendComment: () => void
}) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-xl ${goal.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${goal.completed ? 'bg-orange-500 border-orange-500' : 'border-zinc-600'}`}>
          {goal.completed && <span className="text-white text-xs">✓</span>}
        </div>
        <p className={`text-sm flex-1 ${goal.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
          {goal.description}
        </p>
      </div>

      {/* Botão comentários */}
      <div className="px-4 pb-3">
        <button
          onClick={onToggleComments}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <span>💬</span>
          <span>{commentsOpen ? 'Fechar comentários' : `Comentários${comments ? ` (${comments.length})` : ''}`}</span>
        </button>
      </div>

      {/* Thread de comentários */}
      {commentsOpen && (
        <div className="border-t border-zinc-800 px-4 py-3">
          {comments === undefined ? (
            <p className="text-zinc-600 text-xs text-center py-2">Carregando...</p>
          ) : comments.length === 0 ? (
            <p className="text-zinc-700 text-xs mb-3">Nenhum comentário ainda.</p>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.map(c => (
                <div key={c.id} className={`rounded-xl px-3 py-2.5 ${c.author_is_admin ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-zinc-800'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{c.author_name}</span>
                    {c.author_is_admin && <span className="px-1.5 py-0.5 text-xs font-bold bg-orange-500/30 text-orange-400 rounded-full">Coach</span>}
                    <span className="text-zinc-600 text-xs ml-auto">{formatTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{c.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Input novo comentário (admin) */}
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={commentDraft}
              onChange={e => onCommentDraftChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendComment() } }}
              placeholder="Deixe um feedback para o atleta... (Enter para enviar)"
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none placeholder:text-zinc-600"
            />
            <button
              onClick={onSendComment}
              disabled={sendingComment || !commentDraft.trim()}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-40 self-end"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
