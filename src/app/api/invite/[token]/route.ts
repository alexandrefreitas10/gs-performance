import { initSchema } from '@/lib/db'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  await initSchema()
  const { token } = await params

  const rows = await sql`
    SELECT used_at, expires_at FROM invite_tokens WHERE token = ${token}
  `

  if (rows.length === 0) return NextResponse.json({ valid: false, reason: 'Link inválido.' })
  if (rows[0].used_at) return NextResponse.json({ valid: false, reason: 'Este link já foi utilizado.' })
  if (new Date(rows[0].expires_at) < new Date()) return NextResponse.json({ valid: false, reason: 'Este link expirou.' })

  return NextResponse.json({ valid: true })
}
