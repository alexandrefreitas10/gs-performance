import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql, { initSchema } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  await initSchema()

  const rows = await sql`
    SELECT
      w.id as workout_id,
      w.title as workout_title,
      w.date as workout_date,
      wp.id as part_id,
      wp.title as part_title,
      wp.scoring_type,
      u.id as user_id,
      u.name as athlete_name,
      ar.result_value,
      ar.rpe,
      ar.completed,
      ar.created_at
    FROM athlete_results ar
    JOIN workouts w ON w.id = ar.workout_id
    JOIN workout_parts wp ON wp.id = ar.part_id
    JOIN users u ON u.id = ar.user_id
    WHERE wp.scoring_type != '' AND ar.result_value != ''
    ORDER BY w.date DESC NULLS LAST, w.created_at DESC, wp.sort_order, u.name
  `

  return NextResponse.json(rows)
}
