import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { listAthletes, createUser, updateUserProfile } from '@/lib/users'

export async function GET() {
  const session = await auth()
  if (!session || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const athletes = await listAthletes()
  return NextResponse.json(athletes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { username, password, name, gender, birth_date, email, phone } = await req.json()
  if (!username || !password || !name) {
    return NextResponse.json({ error: 'Campos obrigatórios: username, password, name' }, { status: 400 })
  }
  try {
    const user = await createUser(username, password, name, false, undefined, { gender, birth_date, email, phone })
    return NextResponse.json({ id: user.id, username: user.username, name: user.name }, { status: 201 })
  } catch (e: any) {
    if (e.code === '23505') {
      return NextResponse.json({ error: 'Usuário já existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro ao criar atleta' }, { status: 500 })
  }
}
