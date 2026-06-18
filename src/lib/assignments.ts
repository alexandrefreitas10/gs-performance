import sql, { initSchema } from './db'

export interface Assignment {
  id: number
  workout_id: number
  user_id: number | null
  group_id: number | null
  assigned_at: string
}

export async function assignWorkoutToAthletes(workoutId: number, userIds: number[]): Promise<void> {
  await initSchema()
  await sql`DELETE FROM workout_assignments WHERE workout_id = ${workoutId} AND user_id = ANY(${userIds})`
  for (const userId of userIds) {
    await sql`
      INSERT INTO workout_assignments (workout_id, user_id)
      VALUES (${workoutId}, ${userId})
      ON CONFLICT DO NOTHING
    `
  }
}

export async function removeAssignment(workoutId: number, userId: number): Promise<void> {
  await initSchema()
  await sql`DELETE FROM workout_assignments WHERE workout_id = ${workoutId} AND user_id = ${userId}`
}

export async function getWorkoutAssignees(workoutId: number): Promise<{ id: number; name: string; username: string }[]> {
  await initSchema()
  return sql`
    SELECT u.id, u.name, u.username
    FROM workout_assignments wa
    JOIN users u ON u.id = wa.user_id
    WHERE wa.workout_id = ${workoutId}
    ORDER BY u.name
  `
}

export async function getAthleteWorkouts(userId: number) {
  await initSchema()
  return sql`
    SELECT DISTINCT w.id, w.title, w.date, w.notes, w.created_at
    FROM workouts w
    WHERE w.id IN (
      SELECT workout_id FROM workout_assignments WHERE user_id = ${userId}
      UNION
      SELECT wp.workout_id
      FROM workout_part_assignments wpa
      JOIN workout_parts wp ON wp.id = wpa.part_id
      WHERE wpa.user_id = ${userId}
    )
    ORDER BY date DESC NULLS LAST, created_at DESC
  `
}

export async function getWorkoutPartAssignees(workoutId: number): Promise<Record<number, { id: number; name: string; username: string }[]>> {
  await initSchema()
  const rows = await sql`
    SELECT wpa.part_id, u.id, u.name, u.username
    FROM workout_part_assignments wpa
    JOIN users u ON u.id = wpa.user_id
    JOIN workout_parts wp ON wp.id = wpa.part_id
    WHERE wp.workout_id = ${workoutId}
    ORDER BY u.name
  `
  const result: Record<number, { id: number; name: string; username: string }[]> = {}
  for (const row of rows) {
    if (!result[row.part_id]) result[row.part_id] = []
    result[row.part_id].push({ id: row.id, name: row.name, username: row.username })
  }
  return result
}

export async function assignPartToAthletes(partId: number, userIds: number[]): Promise<void> {
  await initSchema()
  for (const userId of userIds) {
    await sql`
      INSERT INTO workout_part_assignments (part_id, user_id)
      VALUES (${partId}, ${userId})
      ON CONFLICT (part_id, user_id) DO NOTHING
    `
  }
}

export async function removePartAssignment(partId: number, userId: number): Promise<void> {
  await initSchema()
  await sql`DELETE FROM workout_part_assignments WHERE part_id = ${partId} AND user_id = ${userId}`
}
