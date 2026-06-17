import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { initSchema } from '@/lib/db'
import { hasBenchmarks } from '@/lib/benchmarks'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await initSchema()
  const filled = await hasBenchmarks(Number(session.user.id))
  return NextResponse.json({ filled })
}
