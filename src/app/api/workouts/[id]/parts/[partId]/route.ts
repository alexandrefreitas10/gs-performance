import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { updateWorkoutPart } from '@/lib/workouts'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; partId: string }> }) {
  const session = await auth()
  if (!session || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { partId } = await params
  const body = await req.json()
  await updateWorkoutPart(Number(partId), {
    title: body.title ?? '',
    type: body.type ?? '',
    description: body.description ?? '',
    time_cap: body.time_cap ?? null,
    scoring_type: body.scoring_type ?? '',
    exercises: (body.exercises ?? []).map((e: any) => ({
      name: e.name ?? '',
      sets: e.sets ?? null,
      reps: e.reps ?? '',
      load_suggested: e.load_suggested ?? '',
      notes: e.notes ?? '',
    })),
  })
  return NextResponse.json({ ok: true })
}
