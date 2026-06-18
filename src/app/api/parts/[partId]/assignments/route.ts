import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { assignPartToAthletes, removePartAssignment } from '@/lib/assignments'

export async function POST(req: NextRequest, { params }: { params: Promise<{ partId: string }> }) {
  const session = await auth()
  if (!session || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { partId } = await params
  const { userIds } = await req.json()
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: 'userIds é obrigatório' }, { status: 400 })
  }
  await assignPartToAthletes(Number(partId), userIds)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ partId: string }> }) {
  const session = await auth()
  if (!session || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { partId } = await params
  const { userId } = await req.json()
  await removePartAssignment(Number(partId), userId)
  return NextResponse.json({ ok: true })
}
