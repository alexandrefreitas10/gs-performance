import { NextRequest, NextResponse } from 'next/server'
import { findAdminUser, createUser } from '@/lib/users'

export async function POST(req: NextRequest) {
  const existing = await findAdminUser()
  if (existing) {
    return NextResponse.json({ error: 'Admin já existe' }, { status: 409 })
  }
  const { username, password, name } = await req.json()
  if (!username || !password || !name) {
    return NextResponse.json({ error: 'Campos obrigatórios: username, password, name' }, { status: 400 })
  }
  const user = await createUser(username, password, name, true)
  return NextResponse.json({ id: user.id, username: user.username, name: user.name }, { status: 201 })
}
