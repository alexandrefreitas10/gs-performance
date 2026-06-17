import sql, { initSchema } from './db'

export interface Exercise {
  id: number
  part_id: number
  sort_order: number
  name: string
  sets: number | null
  reps: string
  load_suggested: string
  notes: string
}

export interface WorkoutPart {
  id: number
  workout_id: number
  sort_order: number
  title: string
  type: string
  description: string
  time_cap: number | null
  scoring_type: string
  exercises: Exercise[]
}

export interface Workout {
  id: number
  title: string
  date: string | null
  notes: string
  created_by: number | null
  created_at: string
  parts: WorkoutPart[]
}

export async function listWorkouts(): Promise<Omit<Workout, 'parts'>[]> {
  await initSchema()
  return sql<Omit<Workout, 'parts'>[]>`
    SELECT id, title, date, notes, created_by, created_at
    FROM workouts ORDER BY date DESC NULLS LAST, created_at DESC
  `
}

export async function listWorkoutsByAthlete(athleteId: number): Promise<Omit<Workout, 'parts'>[]> {
  await initSchema()
  return sql<Omit<Workout, 'parts'>[]>`
    SELECT w.id, w.title, w.date, w.notes, w.created_by, w.created_at
    FROM workouts w
    JOIN workout_assignments wa ON wa.workout_id = w.id
    WHERE wa.user_id = ${athleteId}
    ORDER BY w.date DESC NULLS LAST, w.created_at DESC
  `
}

export async function getWorkout(id: number): Promise<Workout | null> {
  await initSchema()
  const [workout] = await sql<Omit<Workout, 'parts'>[]>`
    SELECT * FROM workouts WHERE id = ${id}
  `
  if (!workout) return null

  const parts = await sql<Omit<WorkoutPart, 'exercises'>[]>`
    SELECT * FROM workout_parts WHERE workout_id = ${id} ORDER BY sort_order
  `
  const exercises = parts.length > 0
    ? await sql<Exercise[]>`
        SELECT * FROM exercises
        WHERE part_id = ANY(${parts.map(p => p.id)})
        ORDER BY sort_order
      `
    : []

  return {
    ...workout,
    parts: parts.map(p => ({
      ...p,
      exercises: exercises.filter(e => e.part_id === p.id),
    })),
  }
}

export interface CreateWorkoutInput {
  title: string
  date?: string
  notes?: string
  createdBy: number
  parts: {
    title: string
    type?: string
    description?: string
    time_cap?: number
    scoring_type?: string
    exercises: {
      name: string
      sets?: number
      reps?: string
      load_suggested?: string
      notes?: string
    }[]
  }[]
}

export async function createWorkout(input: CreateWorkoutInput): Promise<Workout> {
  await initSchema()

  const [workout] = await sql<Workout[]>`
    INSERT INTO workouts (title, date, notes, created_by)
    VALUES (${input.title}, ${input.date ?? null}, ${input.notes ?? ''}, ${input.createdBy})
    RETURNING *
  `

  for (let pi = 0; pi < input.parts.length; pi++) {
    const p = input.parts[pi]
    const [part] = await sql<WorkoutPart[]>`
      INSERT INTO workout_parts (workout_id, sort_order, title, type, description, time_cap, scoring_type)
      VALUES (${workout.id}, ${pi}, ${p.title}, ${p.type ?? ''}, ${p.description ?? ''}, ${p.time_cap ?? null}, ${p.scoring_type ?? ''})
      RETURNING *
    `
    for (let ei = 0; ei < p.exercises.length; ei++) {
      const e = p.exercises[ei]
      await sql`
        INSERT INTO exercises (part_id, sort_order, name, sets, reps, load_suggested, notes)
        VALUES (${part.id}, ${ei}, ${e.name}, ${e.sets ?? null}, ${e.reps ?? ''}, ${e.load_suggested ?? ''}, ${e.notes ?? ''})
      `
    }
  }

  return (await getWorkout(workout.id))!
}

export async function deleteWorkout(id: number): Promise<void> {
  await initSchema()
  await sql`DELETE FROM workouts WHERE id = ${id}`
}
