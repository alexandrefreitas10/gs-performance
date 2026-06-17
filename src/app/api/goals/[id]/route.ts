import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  if ('completed' in body) {
    await sql`UPDATE goals SET completed = ${body.completed} WHERE id = ${id} AND user_id = ${session.user.id}`
  }
  if ('description' in body) {
    await sql`UPDATE goals SET description = ${body.description} WHERE id = ${id} AND user_id = ${session.user.id}`
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await sql`DELETE FROM goals WHERE id = ${id} AND user_id = ${session.user.id}`
  return NextResponse.json({ ok: true })
}
