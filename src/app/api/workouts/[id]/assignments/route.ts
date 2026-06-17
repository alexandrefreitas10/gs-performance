import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { assignWorkoutToAthletes, getWorkoutAssignees, removeAssignment } from '@/lib/assignments'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params
  const assignees = await getWorkoutAssignees(Number(id))
  return NextResponse.json(assignees)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params
  const { userIds } = await req.json()
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: 'userIds é obrigatório' }, { status: 400 })
  }
  await assignWorkoutToAthletes(Number(id), userIds)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params
  const { userId } = await req.json()
  await removeAssignment(Number(id), userId)
  return NextResponse.json({ ok: true })
}
