import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql, { initSchema } from '@/lib/db'

type Params = { params: Promise<{ userId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await initSchema()
  const { userId } = await params
  const rows = await sql`SELECT * FROM goals WHERE user_id = ${userId} ORDER BY created_at ASC`
  return NextResponse.json(rows)
}
