import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql, { initSchema } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await initSchema()

  const isAdmin = (session.user as any).is_admin
  if (!isAdmin) {
    const [goal] = await sql`SELECT id FROM goals WHERE id = ${id} AND user_id = ${session.user.id}`
    if (!goal) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const comments = await sql`
    SELECT gc.id, gc.message, gc.created_at, u.name as author_name, u.is_admin as author_is_admin
    FROM goal_comments gc
    JOIN users u ON u.id = gc.user_id
    WHERE gc.goal_id = ${id}
    ORDER BY gc.created_at ASC
  `
  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await initSchema()

  const isAdmin = (session.user as any).is_admin
  if (!isAdmin) {
    const [goal] = await sql`SELECT id FROM goals WHERE id = ${id} AND user_id = ${session.user.id}`
    if (!goal) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Mensagem obrigatória' }, { status: 400 })

  const [comment] = await sql`
    INSERT INTO goal_comments (goal_id, user_id, message)
    VALUES (${id}, ${session.user.id}, ${message.trim()})
    RETURNING id, message, created_at
  `
  return NextResponse.json({
    ...comment,
    author_name: session.user.name,
    author_is_admin: isAdmin,
  })
}
