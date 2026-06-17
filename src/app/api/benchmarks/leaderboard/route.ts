import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql, { initSchema } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await initSchema()

  const rows = await sql`
    SELECT b.benchmark_name, b.result_value, u.name as athlete_name, u.gender as athlete_gender
    FROM benchmarks b
    JOIN users u ON u.id = b.user_id
    WHERE u.is_admin = FALSE AND b.result_value != ''
    ORDER BY b.benchmark_name, u.name
  `

  return NextResponse.json(rows)
}
