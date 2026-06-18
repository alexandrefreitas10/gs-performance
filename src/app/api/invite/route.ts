import { auth } from '@/auth'
import { initSchema } from '@/lib/db'
import sql from '@/lib/db'
import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await auth()
  if (!session || !(session?.user as any)?.is_admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  await initSchema()

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await sql`
    INSERT INTO invite_tokens (token, created_by, expires_at)
    VALUES (${token}, ${(session.user as any).id}, ${expiresAt})
  `

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return NextResponse.json({ link: `${baseUrl}/cadastro?token=${token}` })
}
