import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteUser, updateUserPassword } from '@/lib/users'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params
  await deleteUser(Number(id))
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await params
  const { password } = await req.json()
  if (!password) {
    return NextResponse.json({ error: 'Senha obrigatória' }, { status: 400 })
  }
  await updateUserPassword(Number(id), password)
  return NextResponse.json({ ok: true })
}
