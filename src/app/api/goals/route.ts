import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql, { initSchema } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await initSchema()
  const rows = await sql`SELECT * FROM goals WHERE user_id = ${session.user.id} ORDER BY created_at ASC`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await initSchema()
  const { type, description } = await req.json()
  if (!description?.trim()) return NextResponse.json({ error: 'Descrição obrigatória' }, { status: 400 })
  const rows = await sql`
    INSERT INTO goals (user_id, type, description)
    VALUES (${session.user.id}, ${type}, ${description.trim()})
    RETURNING *
  `
  return NextResponse.json(rows[0])
}
