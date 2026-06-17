import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql from '@/lib/db'

type Params = { params: Promise<{ resultId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user || !(session.user as any).is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { resultId } = await params
  const { feedback } = await req.json()
  await sql`UPDATE athlete_results SET admin_feedback = ${feedback ?? ''} WHERE id = ${resultId}`
  return NextResponse.json({ ok: true })
}
