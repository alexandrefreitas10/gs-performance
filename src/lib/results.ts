import sql, { initSchema } from './db'

export interface AthleteResult {
  id: number
  workout_id: number
  part_id: number
  user_id: number
  completed: boolean
  rpe: number | null
  result_value: string
  notes: string
  created_at: string
}

export async function getMyResults(workoutId: number, userId: number): Promise<AthleteResult[]> {
  await initSchema()
  return sql<AthleteResult[]>`
    SELECT * FROM athlete_results
    WHERE workout_id = ${workoutId} AND user_id = ${userId}
  `
}

export async function upsertResult(
  workoutId: number,
  partId: number,
  userId: number,
  data: { completed: boolean; rpe?: number | null; result_value?: string; notes?: string }
): Promise<AthleteResult> {
  await initSchema()
  const [result] = await sql<AthleteResult[]>`
    INSERT INTO athlete_results (workout_id, part_id, user_id, completed, rpe, result_value, notes)
    VALUES (
      ${workoutId}, ${partId}, ${userId},
      ${data.completed},
      ${data.rpe ?? null},
      ${data.result_value ?? ''},
      ${data.notes ?? ''}
    )
    ON CONFLICT (part_id, user_id)
    DO UPDATE SET
      completed = EXCLUDED.completed,
      rpe = EXCLUDED.rpe,
      result_value = EXCLUDED.result_value,
      notes = EXCLUDED.notes
    RETURNING *
  `
  return result
}

export async function getWorkoutResults(workoutId: number) {
  await initSchema()
  return sql`
    SELECT ar.*, u.name as athlete_name, wp.title as part_title
    FROM athlete_results ar
    JOIN users u ON u.id = ar.user_id
    JOIN workout_parts wp ON wp.id = ar.part_id
    WHERE ar.workout_id = ${workoutId}
    ORDER BY u.name, wp.sort_order
  `
}
