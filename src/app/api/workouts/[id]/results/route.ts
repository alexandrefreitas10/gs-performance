import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getMyResults, upsertResult, getWorkoutResults } from '@/lib/results'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const isAdmin = (session.user as any).is_admin

  if (isAdmin) {
    const results = await getWorkoutResults(Number(id))
    return NextResponse.json(results)
  }

  const userId = Number((session.user as any).id)
  const results = await getMyResults(Number(id), userId)
  return NextResponse.json(results)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const userId = Number((session.user as any).id)
  const { partId, completed, rpe, result_value, notes } = await req.json()

  if (!partId) return NextResponse.json({ error: 'partId obrigatório' }, { status: 400 })

  const result = await upsertResult(Number(id), partId, userId, {
    completed: completed ?? false,
    rpe: rpe ?? null,
    result_value: result_value ?? '',
    notes: notes ?? '',
  })
  return NextResponse.json(result)
}
