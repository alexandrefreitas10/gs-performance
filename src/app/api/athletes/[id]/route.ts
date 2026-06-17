import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deleteUser, updateUserPassword, updateUserProfile } from '@/lib/users'

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
  } else {
    const { gender, birth_date, email, phone, name } = body
    await updateUserProfile(Number(id), { gender, birth_date, email, phone, name })
  }
  return NextResponse.json({ ok: true })
}
