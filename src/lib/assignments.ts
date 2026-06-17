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
    SELECT w.id, w.title, w.date, w.notes, w.created_at
    FROM workout_assignments wa
    JOIN workouts w ON w.id = wa.workout_id
    WHERE wa.user_id = ${userId}
    ORDER BY w.date DESC NULLS LAST, w.created_at DESC
  `
}
