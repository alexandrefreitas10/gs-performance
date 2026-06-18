'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

const THEMES = [
  { id: 'laranja', label: 'Laranja', color: '#f97316' },
  { id: 'azul',    label: 'Azul',    color: '#3b82f6' },
  { id: 'verde',   label: 'Verde',   color: '#10b981' },
  { id: 'roxo',    label: 'Roxo',    color: '#8b5cf6' },
]

const FONTS = [
  { id: 'geist',    label: 'Geist',    sample: 'Aa' },
  { id: 'inter',    label: 'Inter',    sample: 'Aa' },
  { id: 'rajdhani', label: 'Rajdhani', sample: 'Aa' },
  { id: 'oswald',   label: 'Oswald',   sample: 'Aa' },
]

const STYLES = [
  { id: 'padrao', label: 'Padrão',  icon: '▣' },
  { id: 'glass',  label: 'Vidro',   icon: '◈' },
  { id: 'nitido', label: 'Nítido',  icon: '◼' },
]

type Props = {
  fontFamilies: Record<string, string>
}

export function ThemeSwitcher({ fontFamilies }: Props) {
  const { data: session } = useSession()
  const [currentTheme, setCurrentTheme] = useState('laranja')
  const [currentFont, setCurrentFont] = useState('geist')
  const [currentStyle, setCurrentStyle] = useState('padrao')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setCurrentTheme(localStorage.getItem('gs_theme') || 'laranja')
    setCurrentFont(localStorage.getItem('gs_font') || 'geist')
    setCurrentStyle(localStorage.getItem('gs_style') || 'padrao')
  }, [])

  function applyTheme(id: string) {
    setCurrentTheme(id)
    localStorage.setItem('gs_theme', id)
    if (id === 'laranja') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', id)
    }
  }

  function applyStyle(id: string) {
    setCurrentStyle(id)
    localStorage.setItem('gs_style', id)
    if (id === 'padrao') {
      document.documentElement.removeAttribute('data-style')
    } else {
      document.documentElement.setAttribute('data-style', id)
    }
  }

  function applyFont(id: string) {
    setCurrentFont(id)
    localStorage.setItem('gs_font', id)
    console.log('[font] id:', id, 'families:', fontFamilies)
    if (id === 'geist') {
      document.body.style.removeProperty('font-family')
    } else {
      const family = fontFamilies[id]
      console.log('[font] applying:', family)
      if (family) document.body.style.fontFamily = family
    }
  }

  if (!session) return null

  return (
    <div className="fixed bottom-5 right-4 z-50">
      {open && (
        <div className="mb-3 bg-zinc-900 border border-zinc-700 rounded-2xl p-4 shadow-xl w-44 max-h-[80vh] overflow-y-auto">

          {/* Cores */}
          <p className="text-zinc-500 text-xs font-semibold mb-2">Cor</p>
          <div className="space-y-1 mb-4">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => applyTheme(t.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  currentTheme === t.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: t.color }} />
                {t.label}
                {currentTheme === t.id && <span className="ml-auto text-orange-500 text-xs">✓</span>}
              </button>
            ))}
          </div>

          {/* Estilos */}
          <p className="text-zinc-500 text-xs font-semibold mb-2">Estilo</p>
          <div className="space-y-1 mb-4">
            {STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => applyStyle(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  currentStyle === s.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span className="shrink-0 text-sm">{s.icon}</span>
                {s.label}
                {currentStyle === s.id && <span className="ml-auto text-orange-500 text-xs">✓</span>}
              </button>
            ))}
          </div>

          {/* Fontes */}
          <p className="text-zinc-500 text-xs font-semibold mb-2">Fonte</p>
          <div className="space-y-1">
            {FONTS.map(f => (
              <button
                key={f.id}
                onClick={() => applyFont(f.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  currentFont === f.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span className="shrink-0 text-base leading-none" style={{ fontFamily: fontFamilies[f.id] }}>{f.sample}</span>
                <span style={{ fontFamily: fontFamilies[f.id] }}>{f.label}</span>
                {currentFont === f.id && <span className="ml-auto text-orange-500 text-xs">✓</span>}
              </button>
            ))}
          </div>

        </div>
      )}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-11 h-11 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-lg shadow-lg transition-colors"
        title="Aparência"
      >
        🎨
      </button>
    </div>
  )
}
