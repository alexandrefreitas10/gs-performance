import { initSchema } from '@/lib/db'
import sql from '@/lib/db'
import { createUser } from '@/lib/users'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  await initSchema()

  const { token, name, username, password, gender, birth_date, email, phone } = await req.json()

  if (!token || !name || !username || !password) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 })
  }

  const rows = await sql`
    SELECT id, used_at, expires_at FROM invite_tokens WHERE token = ${token}
  `

  if (rows.length === 0) return NextResponse.json({ error: 'Link inválido.' }, { status: 400 })
  if (rows[0].used_at) return NextResponse.json({ error: 'Este link já foi utilizado.' }, { status: 400 })
  if (new Date(rows[0].expires_at) < new Date()) return NextResponse.json({ error: 'Este link expirou.' }, { status: 400 })

  try {
    await createUser(username, password, name, false, undefined, {
      gender: gender || '',
      birth_date: birth_date || null,
      email: email || '',
      phone: phone || '',
    })
  } catch (e: any) {
    if (e?.message?.includes('unique') || e?.code === '23505') {
      return NextResponse.json({ error: 'Nome de usuário já está em uso.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro ao criar conta.' }, { status: 500 })
  }

  await sql`UPDATE invite_tokens SET used_at = NOW() WHERE id = ${rows[0].id}`

  return NextResponse.json({ ok: true })
}
