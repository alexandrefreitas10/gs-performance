import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  const { name, date, location, notes } = await req.json()
  if (!name?.trim() || !date) {
    return NextResponse.json({ error: 'Nome e data são obrigatórios' }, { status: 400 })
  }
  const rows = await sql`
    UPDATE competitions SET name = ${name.trim()}, date = ${date}, location = ${location ?? ''}, notes = ${notes ?? ''}
    WHERE id = ${id} RETURNING *
  `
  return NextResponse.json(rows[0])
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  await sql`DELETE FROM competitions WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
