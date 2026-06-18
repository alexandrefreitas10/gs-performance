import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  max: 10,
})

let schemaInitialized = false

export async function initSchema() {
  if (schemaInitialized) return
  schemaInitialized = true
  try { await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      is_admin BOOLEAN DEFAULT FALSE,
      group_id INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS workouts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      date DATE,
      notes TEXT DEFAULT '',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS workout_parts (
      id SERIAL PRIMARY KEY,
      workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL,
      type TEXT DEFAULT '',
      description TEXT DEFAULT '',
      time_cap INTEGER
    );
    CREATE TABLE IF NOT EXISTS exercises (
      id SERIAL PRIMARY KEY,
      part_id INTEGER NOT NULL REFERENCES workout_parts(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      name TEXT NOT NULL,
      sets INTEGER,
      reps TEXT DEFAULT '',
      load_suggested TEXT DEFAULT '',
      notes TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS workout_assignments (
      id SERIAL PRIMARY KEY,
      workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      assigned_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS athlete_results (
      id SERIAL PRIMARY KEY,
      workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      part_id INTEGER NOT NULL REFERENCES workout_parts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      completed BOOLEAN DEFAULT FALSE,
      rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
      result_value TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(part_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS benchmarks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      benchmark_name TEXT NOT NULL,
      result_value TEXT NOT NULL,
      date DATE,
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS competitions (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      date DATE NOT NULL,
      location TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE competitions ADD COLUMN IF NOT EXISTS end_date DATE;
    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('curto_prazo', 'longo_prazo')),
      description TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS goal_comments (
      id SERIAL PRIMARY KEY,
      goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE workout_parts ADD COLUMN IF NOT EXISTS scoring_type TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
    ALTER TABLE athlete_results ADD COLUMN IF NOT EXISTS video_s3_key TEXT DEFAULT '';
    ALTER TABLE athlete_results ADD COLUMN IF NOT EXISTS video_name TEXT DEFAULT '';
    ALTER TABLE athlete_results ADD COLUMN IF NOT EXISTS admin_feedback TEXT DEFAULT '';
    ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'benchmarks_user_id_benchmark_name_key'
      ) THEN
        ALTER TABLE benchmarks ADD CONSTRAINT benchmarks_user_id_benchmark_name_key UNIQUE (user_id, benchmark_name);
      END IF;
    END $$;
  `) } catch (e) { console.error('initSchema error:', e) }
}

export default sql
