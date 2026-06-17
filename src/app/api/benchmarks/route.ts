import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { initSchema } from '@/lib/db'
import { getBenchmarksByUser, hasBenchmarks, upsertBenchmarks } from '@/lib/benchmarks'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await initSchema()
  const rows = await getBenchmarksByUser(Number(session.user.id))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await initSchema()
  const { entries } = await req.json()
  await upsertBenchmarks(Number(session.user.id), entries)
  return NextResponse.json({ ok: true })
}
