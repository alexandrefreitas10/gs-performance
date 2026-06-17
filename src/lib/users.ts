import bcrypt from 'bcryptjs'
import sql, { initSchema } from './db'

export interface User {
  id: number
  username: string
  password_hash: string
  name: string
  is_admin: boolean
  group_id: number | null
  gender: string
  birth_date: string | null
  email: string
  phone: string
  created_at: string
}

export async function findUserByUsername(username: string): Promise<User | null> {
  await initSchema()
  const [user] = await sql<User[]>`SELECT * FROM users WHERE username = ${username} LIMIT 1`
  return user ?? null
}

export async function findUserById(id: number): Promise<User | null> {
  await initSchema()
  const [user] = await sql<User[]>`SELECT * FROM users WHERE id = ${id} LIMIT 1`
  return user ?? null
}

export async function findAdminUser(): Promise<User | null> {
  await initSchema()
  const [user] = await sql<User[]>`SELECT * FROM users WHERE is_admin = TRUE LIMIT 1`
  return user ?? null
}

export async function createUser(
  username: string,
  password: string,
  name: string,
  isAdmin = false,
  groupId?: number,
  extra?: { gender?: string; birth_date?: string; email?: string; phone?: string },
): Promise<User> {
  await initSchema()
  const hash = await bcrypt.hash(password, 12)
  const [user] = await sql<User[]>`
    INSERT INTO users (username, password_hash, name, is_admin, group_id, gender, birth_date, email, phone)
    VALUES (
      ${username}, ${hash}, ${name}, ${isAdmin}, ${groupId ?? null},
      ${extra?.gender ?? ''},
      ${extra?.birth_date ?? null},
      ${extra?.email ?? ''},
      ${extra?.phone ?? ''}
    )
    RETURNING *
  `
  return user
}

export async function listAthletes(): Promise<Omit<User, 'password_hash'>[]> {
  await initSchema()
  return sql<Omit<User, 'password_hash'>[]>`
    SELECT id, username, name, is_admin, group_id, gender, birth_date, email, phone, created_at
    FROM users WHERE is_admin = FALSE ORDER BY name
  `
}

export async function updateUserProfile(id: number, fields: Partial<Pick<User, 'gender' | 'birth_date' | 'email' | 'phone' | 'name'>>): Promise<void> {
  await initSchema()
  await sql`
    UPDATE users SET
      gender = COALESCE(${fields.gender ?? null}, gender),
      birth_date = COALESCE(${fields.birth_date ?? null}, birth_date),
      email = COALESCE(${fields.email ?? null}, email),
      phone = COALESCE(${fields.phone ?? null}, phone),
      name = COALESCE(${fields.name ?? null}, name)
    WHERE id = ${id}
  `
}

export async function updateUserPassword(id: number, password: string): Promise<void> {
  await initSchema()
  const hash = await bcrypt.hash(password, 12)
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${id}`
}

export async function deleteUser(id: number): Promise<void> {
  await initSchema()
  await sql`DELETE FROM users WHERE id = ${id}`
}
