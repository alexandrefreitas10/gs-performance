import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { listWorkouts, listWorkoutsByAthlete, createWorkout } from '@/lib/workouts'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const athleteId = searchParams.get('athleteId')
  const workouts = athleteId ? await listWorkoutsByAthlete(Number(athleteId)) : await listWorkouts()
  return NextResponse.json(workouts)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const body = await req.json()
  if (!body.title || !body.parts) {
    return NextResponse.json({ error: 'title e parts são obrigatórios' }, { status: 400 })
  }
  const workout = await createWorkout({
    ...body,
    createdBy: Number((session.user as any).id),
  })
  return NextResponse.json(workout, { status: 201 })
}
