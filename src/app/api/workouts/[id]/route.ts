import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getWorkout, deleteWorkout } from '@/lib/workouts'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { id } = await params
  const workout = await getWorkout(Number(id))
  if (!workout) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json(workout)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params
  await deleteWorkout(Number(id))
  return NextResponse.json({ ok: true })
}
