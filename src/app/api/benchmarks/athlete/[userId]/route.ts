import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { initSchema } from '@/lib/db'
import { getBenchmarksByUser } from '@/lib/benchmarks'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth()
  if (!session?.user || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await initSchema()
  const { userId } = await params
  const rows = await getBenchmarksByUser(Number(userId))
  return NextResponse.json(rows)
}
