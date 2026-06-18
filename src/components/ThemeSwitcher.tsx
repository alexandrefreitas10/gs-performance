'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const THEMES = [
  { id: 'laranja', label: 'Laranja', color: '#f97316' },
  { id: 'azul',    label: 'Azul',    color: '#3b82f6' },
  { id: 'verde',   label: 'Verde',   color: '#10b981' },
  { id: 'roxo',    label: 'Roxo',    color: '#8b5cf6' },
]

export function ThemeSwitcher() {
  const { data: session } = useSession()
  const [current, setCurrent] = useState('laranja')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('gs_theme') || 'laranja'
    setCurrent(saved)
  }, [])

  function applyTheme(id: string) {
    setCurrent(id)
    localStorage.setItem('gs_theme', id)
    if (id === 'laranja') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', id)
    }
    setOpen(false)
  }

  if (!session) return null

  return (
    <div className="fixed bottom-5 right-4 z-50">
      {open && (
        <div className="mb-3 bg-zinc-900 border border-zinc-700 rounded-2xl p-3 shadow-xl min-w-[140px]">
          <p className="text-zinc-500 text-xs font-semibold mb-2 px-1">Tema</p>
          <div className="space-y-1">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => applyTheme(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  current === t.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: t.color }} />
                {t.label}
                {current === t.id && <span className="ml-auto text-orange-500 text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-11 h-11 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-lg shadow-lg transition-colors"
        title="Trocar tema"
      >
        🎨
      </button>
    </div>
  )
}
