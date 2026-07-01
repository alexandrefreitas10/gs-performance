'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import * as XLSX from 'xlsx'

/* ─── Types ─── */
interface Exercise { name: string; sets?: string; reps?: string; load_suggested?: string; notes?: string }
interface Part { _num: number; title: string; type: string; time_cap?: number | ''; exercises: Exercise[] }
interface ParsedWorkout {
  _key: string; title: string; date: string; notes: string
  parts: Part[]; assignees: number[]; status: 'idle' | 'saving' | 'saved' | 'error'; errorMsg?: string
}
interface Athlete { id: number; name: string; username: string }

const TYPE_LABELS: Record<string, string> = {
  aquecimento: 'Aquecimento', amrap: 'AMRAP', emom: 'EMOM', fortime: 'For Time', outro: 'Outro',
}
const TIPOS = Object.keys(TYPE_LABELS)

const DAY_MAP: Record<string, number> = {
  segunda: 0, 'segunda-feira': 0,
  terca: 1, terça: 1, 'terça-feira': 1, 'terca-feira': 1,
  quarta: 2, 'quarta-feira': 2,
  quinta: 3, 'quinta-feira': 3,
  sexta: 4, 'sexta-feira': 4,
  sabado: 5, sábado: 5,
  domingo: 6,
}

function addDays(base: string, n: number): string {
  if (!base) return ''
  const d = new Date(base + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function detectPartType(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('amrap')) return 'amrap'
  if (t.includes('emom')) return 'emom'
  if (t.includes('for time') || t.includes('fortime') || t.includes('rft')) return 'fortime'
  if (t.includes('aquecimento') || t.includes('mobilidade') || t.includes('warm')) return 'aquecimento'
  return 'outro'
}

function parseTimeCap(text: string): number | '' {
  const m = text.match(/(\d+)['']?\s*(min|minuto)/i) || text.match(/(\d+)\s*x\s*\d+/i)
  return m ? parseInt(m[1]) : ''
}

/* ─── Column-based parser (GSPerformance format) ─── */
function parseColumnFormat(ws: XLSX.WorkSheet, weekStart: string): ParsedWorkout[] {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  const workouts: ParsedWorkout[] = []

  for (let c = range.s.c; c <= range.e.c; c++) {
    const headerCell = ws[XLSX.utils.encode_cell({ r: 1, c })]
    if (!headerCell) continue
    const dayName = String(headerCell.v || '').trim()
    const dayKey = dayName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const dayOffset = DAY_MAP[dayKey]
    if (dayOffset === undefined) continue

    // Collect all non-empty lines for this day column
    const rawLines: { text: string; isEmpty: boolean }[] = []
    for (let r = 2; r <= range.e.r; r++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })]
      const val = cell ? String(cell.v || '').trim() : ''
      rawLines.push({ text: val, isEmpty: val === '' })
    }

    // Remove trailing empty lines
    while (rawLines.length > 0 && rawLines[rawLines.length - 1].isEmpty) rawLines.pop()
    if (rawLines.every(l => l.isEmpty)) continue

    // Split into sections by empty lines
    const sections: string[][] = []
    let current: string[] = []
    for (const line of rawLines) {
      if (line.isEmpty) {
        if (current.length > 0) { sections.push(current); current = [] }
      } else {
        current.push(line.text)
      }
    }
    if (current.length > 0) sections.push(current)
    if (sections.length === 0) continue

    // Merge very small sections (1 line) into next section if next starts with related content
    const merged: string[][] = []
    let i = 0
    while (i < sections.length) {
      const s = sections[i]
      if (s.length === 1 && i + 1 < sections.length) {
        merged.push([...s, ...sections[i + 1]])
        i += 2
      } else {
        merged.push(s)
        i++
      }
    }

    const parts: Part[] = merged.map((section, idx) => {
      const title = section[0]
      const contentLines = section.slice(1).filter(l => l.trim())
      const type = detectPartType(title)
      const timeCap = parseTimeCap(title)
      return {
        _num: idx + 1,
        title,
        type,
        time_cap: timeCap,
        exercises: contentLines.map(l => ({ name: l })),
      }
    })

    workouts.push({
      _key: `${dayName}__${weekStart}`,
      title: `Treino ${dayName}`,
      date: addDays(weekStart, dayOffset),
      notes: '',
      parts,
      assignees: [],
      status: 'idle',
    })
  }

  return workouts
}

/* ─── Template-based parser ─── */
function parseTemplateFormat(ws: XLSX.WorkSheet): ParsedWorkout[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { raw: false, defval: '' })
  const map = new Map<string, ParsedWorkout>()

  for (const row of rows) {
    const dateRaw = String(row['data'] || '').trim()
    const title = String(row['titulo_treino'] || '').trim()
    if (!title) continue
    const key = `${dateRaw}__${title}`
    if (!map.has(key)) {
      const p = dateRaw.split('/')
      const date = p.length === 3 ? `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}` : dateRaw
      map.set(key, { _key: key, title, date, notes: '', parts: [], assignees: [], status: 'idle' })
    }
    const workout = map.get(key)!
    const partNum = parseInt(String(row['parte'] || '1')) || 1
    let part = workout.parts.find(p => p._num === partNum)
    if (!part) {
      const rawTC = String(row['time_cap'] || '').trim()
      part = { _num: partNum, title: String(row['nome_parte'] || `Parte ${partNum}`).trim(),
        type: String(row['tipo_parte'] || 'outro').trim() || 'outro',
        time_cap: rawTC ? parseInt(rawTC) || '' : '', exercises: [] }
      workout.parts.push(part)
      workout.parts.sort((a, b) => a._num - b._num)
    }
    const exName = String(row['exercicio'] || '').trim()
    if (exName) {
      part.exercises.push({ name: exName,
        sets: String(row['series'] || '').trim() || undefined,
        reps: String(row['reps'] || '').trim() || undefined,
        load_suggested: String(row['carga_lbs'] || '').trim() || undefined,
        notes: String(row['notas'] || '').trim() || undefined })
    }
  }
  return Array.from(map.values())
}

/* ─── Auto-detect format ─── */
function detectFormat(ws: XLSX.WorkSheet): 'column' | 'template' {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let c = range.s.c; c <= Math.min(range.e.c, 20); c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 1, c })]
    if (cell) {
      const val = String(cell.v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (Object.keys(DAY_MAP).some(d => val.startsWith(d))) return 'column'
    }
  }
  return 'template'
}

function downloadTemplate() {
  const headers = ['data','titulo_treino','parte','nome_parte','tipo_parte','time_cap','exercicio','series','reps','carga_lbs','notas']
  const rows = [
    ['06/01/2025','Treino Segunda','1','Aquecimento','aquecimento','','Corrida leve','','10min','',''],
    ['06/01/2025','Treino Segunda','1','Aquecimento','aquecimento','','Mobilidade quadril','3','10','','Cada lado'],
    ['06/01/2025','Treino Segunda','2','Força','fortime','20','Agachamento','5','5','185','Foco na postura'],
    ['07/01/2025','Treino Terça','1','AMRAP 12min','amrap','12','Burpees','','10','',''],
  ]
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = [12,22,7,18,14,10,26,8,10,10,30].map(wch => ({ wch }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Treinos')
  XLSX.writeFile(wb, 'template-treinos.xlsx')
}

/* ─── Main page ─── */
export default function ImportarPlanilhaPage() {
  const [workouts, setWorkouts] = useState<ParsedWorkout[]>([])
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [step, setStep] = useState<'upload' | 'preview'>('upload')
  const [dragging, setDragging] = useState(false)
  const [saveAllLoading, setSaveAllLoading] = useState(false)
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); const day = d.getDay()
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    return d.toISOString().split('T')[0]
  })
  const [detectedFormat, setDetectedFormat] = useState<'column' | 'template'>('column')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetch('/api/athletes').then(r => r.json()).then(setAthletes) }, [])

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const buf = e.target?.result as ArrayBuffer
      const wb = XLSX.read(buf, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const fmt = detectFormat(ws)
      setDetectedFormat(fmt)
      const parsed = fmt === 'column' ? parseColumnFormat(ws, weekStart) : parseTemplateFormat(ws)
      if (parsed.length === 0) { alert('Nenhum treino encontrado no arquivo.'); return }
      setWorkouts(parsed)
      setStep('preview')
    }
    reader.readAsArrayBuffer(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]; if (file) handleFile(file)
  }, [weekStart])

  function updateWorkout(key: string, patch: Partial<ParsedWorkout>) {
    setWorkouts(ws => ws.map(w => w._key === key ? { ...w, ...patch } : w))
  }
  function updatePart(wKey: string, pNum: number, patch: Partial<Part>) {
    setWorkouts(ws => ws.map(w => w._key !== wKey ? w :
      { ...w, parts: w.parts.map(p => p._num === pNum ? { ...p, ...patch } : p) }))
  }
  function updateExercise(wKey: string, pNum: number, ei: number, patch: Partial<Exercise>) {
    setWorkouts(ws => ws.map(w => w._key !== wKey ? w : { ...w,
      parts: w.parts.map(p => p._num !== pNum ? p :
        { ...p, exercises: p.exercises.map((ex, i) => i === ei ? { ...ex, ...patch } : ex) }) }))
  }
  function addExercise(wKey: string, pNum: number) {
    setWorkouts(ws => ws.map(w => w._key !== wKey ? w : { ...w,
      parts: w.parts.map(p => p._num !== pNum ? p :
        { ...p, exercises: [...p.exercises, { name: '' }] }) }))
  }
  function removeExercise(wKey: string, pNum: number, ei: number) {
    setWorkouts(ws => ws.map(w => w._key !== wKey ? w : { ...w,
      parts: w.parts.map(p => p._num !== pNum ? p :
        { ...p, exercises: p.exercises.filter((_, i) => i !== ei) }) }))
  }
  function toggleAssignee(wKey: string, athleteId: number) {
    setWorkouts(ws => ws.map(w => w._key !== wKey ? w : {
      ...w, assignees: w.assignees.includes(athleteId)
        ? w.assignees.filter(id => id !== athleteId) : [...w.assignees, athleteId]
    }))
  }

  async function saveWorkout(w: ParsedWorkout) {
    updateWorkout(w._key, { status: 'saving' })
    try {
      const body = {
        title: w.title, date: w.date || undefined, notes: w.notes || undefined,
        parts: w.parts.map(p => ({
          title: p.title, type: p.type || 'outro',
          time_cap: p.time_cap ? Number(p.time_cap) : undefined,
          exercises: p.exercises.filter(e => e.name.trim()).map(e => ({
            name: e.name, sets: e.sets ? Number(e.sets) : undefined,
            reps: e.reps || undefined, load_suggested: e.load_suggested || undefined,
            notes: e.notes || undefined,
          })),
        })),
      }
      const res = await fetch('/api/workouts', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await res.text())
      const created = await res.json()
      if (w.assignees.length > 0) {
        await fetch(`/api/workouts/${created.id}/assignments`, { method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: w.assignees }) })
      }
      updateWorkout(w._key, { status: 'saved' })
    } catch (err) {
      updateWorkout(w._key, { status: 'error', errorMsg: String(err) })
    }
  }

  async function saveAll() {
    setSaveAllLoading(true)
    for (const w of workouts.filter(w => w.status === 'idle' || w.status === 'error')) await saveWorkout(w)
    setSaveAllLoading(false)
  }

  const savedCount = workouts.filter(w => w.status === 'saved').length

  /* ── Upload step ── */
  if (step === 'upload') return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/treinos" className="text-zinc-500 hover:text-white transition-colors text-sm">← Treinos</Link>
        <span className="text-zinc-700">/</span>
        <span className="text-white text-sm font-semibold">Importar Planilha</span>
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Importar Planilha</h1>
      <p className="text-zinc-400 text-sm mb-8">Envie a planilha semanal de treinos — o sistema detecta o formato automaticamente.</p>

      {/* Week date picker */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
        <p className="text-white font-bold mb-1">Semana de início</p>
        <p className="text-zinc-400 text-sm mb-3">Selecione a data da Segunda-feira da semana da planilha.</p>
        <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)}
          className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
      </div>

      {/* Upload area */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
        <p className="text-white font-bold mb-3">Envie a planilha</p>
        <div onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)} onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            dragging ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-700 hover:border-zinc-500'}`}>
          <p className="text-4xl mb-3">📊</p>
          <p className="text-white font-semibold mb-1">Arraste a planilha aqui</p>
          <p className="text-zinc-500 text-sm">ou clique para selecionar</p>
          <p className="text-zinc-600 text-xs mt-2">.xlsx · .xls</p>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>

      {/* Template download */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <p className="text-zinc-400 text-sm">Prefere usar um template padrão com colunas fixas?</p>
        <button onClick={downloadTemplate}
          className="shrink-0 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors">
          📥 Baixar template
        </button>
      </div>
    </main>
  )

  /* ── Preview step ── */
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep('upload')} className="text-zinc-500 hover:text-white transition-colors text-sm">← Voltar</button>
          <span className="text-zinc-700">/</span>
          <span className="text-white text-sm font-semibold">Revisão</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${detectedFormat === 'column' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>
            {detectedFormat === 'column' ? 'Formato semanal' : 'Template padrão'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {savedCount > 0 && <span className="text-green-400 text-sm font-semibold">{savedCount}/{workouts.length} salvos</span>}
          <button onClick={saveAll} disabled={saveAllLoading || workouts.every(w => w.status === 'saved')}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors">
            {saveAllLoading ? 'Salvando...' : 'Salvar todos'}
          </button>
        </div>
      </div>

      <p className="text-zinc-500 text-sm mb-6">
        {workouts.length} treino{workouts.length !== 1 ? 's' : ''} encontrado{workouts.length !== 1 ? 's' : ''}. Revise, edite e atribua atletas antes de salvar.
      </p>

      <div className="space-y-6">
        {workouts.map(w => (
          <WorkoutCard key={w._key} workout={w} athletes={athletes}
            onUpdateWorkout={p => updateWorkout(w._key, p)}
            onUpdatePart={(pn, p) => updatePart(w._key, pn, p)}
            onUpdateExercise={(pn, i, p) => updateExercise(w._key, pn, i, p)}
            onAddExercise={pn => addExercise(w._key, pn)}
            onRemoveExercise={(pn, i) => removeExercise(w._key, pn, i)}
            onToggleAssignee={id => toggleAssignee(w._key, id)}
            onSave={() => saveWorkout(w)} />
        ))}
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Link href="/treinos" className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-sm transition-colors">
          Ver treinos
        </Link>
        <button onClick={saveAll} disabled={saveAllLoading || workouts.every(w => w.status === 'saved')}
          className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors">
          {saveAllLoading ? 'Salvando...' : 'Salvar todos'}
        </button>
      </div>
    </main>
  )
}

/* ─── WorkoutCard ─── */
function WorkoutCard({ workout, athletes, onUpdateWorkout, onUpdatePart, onUpdateExercise,
  onAddExercise, onRemoveExercise, onToggleAssignee, onSave }: {
  workout: ParsedWorkout; athletes: Athlete[]
  onUpdateWorkout: (p: Partial<ParsedWorkout>) => void
  onUpdatePart: (pNum: number, p: Partial<Part>) => void
  onUpdateExercise: (pNum: number, idx: number, p: Partial<Exercise>) => void
  onAddExercise: (pNum: number) => void
  onRemoveExercise: (pNum: number, idx: number) => void
  onToggleAssignee: (id: number) => void
  onSave: () => void
}) {
  const isSaved = workout.status === 'saved'
  const isSaving = workout.status === 'saving'

  return (
    <div className={`bg-zinc-900 border rounded-2xl overflow-hidden ${isSaved ? 'border-green-600/40' : 'border-zinc-800'}`}>
      {/* Header */}
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <input disabled={isSaved} value={workout.title}
              onChange={e => onUpdateWorkout({ title: e.target.value })}
              className="w-full bg-transparent text-white font-black text-lg focus:outline-none disabled:opacity-60"
              placeholder="Título do treino" />
            <input disabled={isSaved} type="date" value={workout.date}
              onChange={e => onUpdateWorkout({ date: e.target.value })}
              className="mt-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-60" />
          </div>
          <div className="shrink-0">
            {isSaved
              ? <span className="px-3 py-1.5 bg-green-600/20 text-green-400 text-sm font-bold rounded-lg">✓ Salvo</span>
              : <button onClick={onSave} disabled={isSaving}
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors">
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>}
          </div>
        </div>
        {workout.status === 'error' && <p className="mt-2 text-red-400 text-xs">{workout.errorMsg}</p>}
      </div>

      {/* Parts */}
      <div className="p-5 space-y-4">
        {workout.parts.map((part, pi) => (
          <div key={part._num} className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-zinc-500 text-xs font-semibold shrink-0">Parte {pi + 1}</span>
              <input disabled={isSaved} value={part.title}
                onChange={e => onUpdatePart(part._num, { title: e.target.value })}
                className="flex-1 min-w-0 bg-transparent text-white font-bold text-sm focus:outline-none border-b border-transparent focus:border-zinc-600 disabled:opacity-60"
                placeholder="Nome da parte" />
              <select disabled={isSaved} value={part.type}
                onChange={e => onUpdatePart(part._num, { type: e.target.value })}
                className="bg-zinc-700 text-xs text-zinc-300 rounded-lg px-2 py-1 focus:outline-none disabled:opacity-60">
                {TIPOS.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
              <div className="flex items-center gap-1">
                <input disabled={isSaved} type="number" value={part.time_cap ?? ''}
                  onChange={e => onUpdatePart(part._num, { time_cap: e.target.value ? Number(e.target.value) : '' })}
                  className="w-14 bg-zinc-700 text-xs text-zinc-300 rounded-lg px-2 py-1 focus:outline-none text-center disabled:opacity-60"
                  placeholder="min" />
                <span className="text-zinc-500 text-xs">min</span>
              </div>
            </div>

            <div className="space-y-1">
              {part.exercises.map((ex, ei) => (
                <div key={ei} className="flex items-start gap-2 group">
                  <div className="flex-1 grid grid-cols-12 gap-1 text-xs">
                    <input disabled={isSaved} value={ex.name}
                      onChange={e => onUpdateExercise(part._num, ei, { name: e.target.value })}
                      className="col-span-5 bg-transparent text-white focus:outline-none border-b border-transparent focus:border-zinc-600 py-0.5 disabled:opacity-60"
                      placeholder="Exercício" />
                    <input disabled={isSaved} value={ex.sets ?? ''}
                      onChange={e => onUpdateExercise(part._num, ei, { sets: e.target.value })}
                      className="col-span-1 bg-transparent text-zinc-400 text-center focus:outline-none border-b border-transparent focus:border-zinc-600 py-0.5 disabled:opacity-60"
                      placeholder="Séries" />
                    <input disabled={isSaved} value={ex.reps ?? ''}
                      onChange={e => onUpdateExercise(part._num, ei, { reps: e.target.value })}
                      className="col-span-2 bg-transparent text-zinc-400 text-center focus:outline-none border-b border-transparent focus:border-zinc-600 py-0.5 disabled:opacity-60"
                      placeholder="Reps" />
                    <input disabled={isSaved} value={ex.load_suggested ?? ''}
                      onChange={e => onUpdateExercise(part._num, ei, { load_suggested: e.target.value })}
                      className="col-span-2 bg-transparent text-zinc-400 text-center focus:outline-none border-b border-transparent focus:border-zinc-600 py-0.5 disabled:opacity-60"
                      placeholder="Carga" />
                    <input disabled={isSaved} value={ex.notes ?? ''}
                      onChange={e => onUpdateExercise(part._num, ei, { notes: e.target.value })}
                      className="col-span-2 bg-transparent text-zinc-500 focus:outline-none border-b border-transparent focus:border-zinc-600 py-0.5 disabled:opacity-60"
                      placeholder="Notas" />
                  </div>
                  {!isSaved && (
                    <button onClick={() => onRemoveExercise(part._num, ei)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all text-sm mt-0.5">×</button>
                  )}
                </div>
              ))}
            </div>

            {!isSaved && (
              <button onClick={() => onAddExercise(part._num)}
                className="mt-2 text-xs text-zinc-600 hover:text-orange-400 transition-colors">
                + adicionar linha
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Athletes */}
      <div className="px-5 pb-5">
        <p className="text-zinc-500 text-xs font-semibold mb-2">Atribuir a atletas</p>
        <div className="flex flex-wrap gap-2">
          {athletes.map(a => {
            const sel = workout.assignees.includes(a.id)
            return (
              <button key={a.id} disabled={isSaved} onClick={() => onToggleAssignee(a.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors disabled:cursor-default ${
                  sel ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white border border-transparent'}`}>
                {sel ? '✓ ' : ''}{a.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
