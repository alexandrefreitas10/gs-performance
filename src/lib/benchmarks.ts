import sql from './db'

export interface BenchmarkRow {
  id: number
  user_id: number
  benchmark_name: string
  result_value: string
  notes: string
}

export async function getBenchmarksByUser(userId: number): Promise<BenchmarkRow[]> {
  return sql<BenchmarkRow[]>`
    SELECT id, user_id, benchmark_name, result_value, notes
    FROM benchmarks
    WHERE user_id = ${userId}
    ORDER BY id
  `
}

export async function hasBenchmarks(userId: number): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM benchmarks WHERE user_id = ${userId} LIMIT 1`
  return rows.length > 0
}

export async function upsertBenchmarks(
  userId: number,
  entries: { benchmark_name: string; result_value: string; notes?: string }[]
) {
  for (const entry of entries) {
    if (!entry.result_value.trim()) continue
    await sql`
      INSERT INTO benchmarks (user_id, benchmark_name, result_value, notes)
      VALUES (${userId}, ${entry.benchmark_name}, ${entry.result_value}, ${entry.notes ?? ''})
      ON CONFLICT (user_id, benchmark_name)
      DO UPDATE SET result_value = EXCLUDED.result_value, notes = EXCLUDED.notes
    `
  }
}

export async function getAllAthleteBenchmarks() {
  return sql`
    SELECT b.id, b.user_id, b.benchmark_name, b.result_value, b.notes, u.name as athlete_name
    FROM benchmarks b
    JOIN users u ON u.id = b.user_id
    WHERE u.is_admin = FALSE
    ORDER BY u.name, b.benchmark_name
  `
}
