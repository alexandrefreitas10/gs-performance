import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteUser, updateUserPassword, updateUserGender } from '@/lib/users'

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
  const body = await req.json()
  if (body.password) {
    await updateUserPassword(Number(id), body.password)
  } else if (body.gender !== undefined) {
    await updateUserGender(Number(id), body.gender)
  } else {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
