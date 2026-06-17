import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAthleteWorkouts } from '@/lib/assignments'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = Number((session.user as any).id)
  const workouts = await getAthleteWorkouts(userId)
  return NextResponse.json(workouts)
}
