import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql, { initSchema } from '@/lib/db'

export async function GET() {
  await initSchema()
  const rows = await sql`SELECT * FROM competitions ORDER BY date ASC`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await initSchema()
  const { name, date, end_date, location, notes } = await req.json()
  if (!name?.trim() || !date) {
    return NextResponse.json({ error: 'Nome e data de início são obrigatórios' }, { status: 400 })
  }
  const rows = await sql`
    INSERT INTO competitions (name, date, end_date, location, notes)
    VALUES (${name.trim()}, ${date}, ${end_date ?? null}, ${location ?? ''}, ${notes ?? ''})
    RETURNING *
  `
  return NextResponse.json(rows[0])
}
