import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getWorkoutPartAssignees } from '@/lib/assignments'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params
  const result = await getWorkoutPartAssignees(Number(id))
  return NextResponse.json(result)
}
