import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql, { initSchema } from '@/lib/db'
import { uploadFile, deleteFile, getSignedViewUrl, getSignedDownloadUrl } from '@/lib/s3'

type Params = { params: Promise<{ resultId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await initSchema()
  const { resultId } = await params

  const rows = await sql`SELECT * FROM athlete_results WHERE id = ${resultId} AND user_id = ${session.user.id}`
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('video') as File
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

  const maxSize = 500 * 1024 * 1024 // 500MB
  if (file.size > maxSize) return NextResponse.json({ error: 'Arquivo muito grande (máx 500MB)' }, { status: 400 })

  // Remove vídeo anterior se existir
  const existing = rows[0]
  if (existing.video_s3_key) {
    await deleteFile(existing.video_s3_key).catch(() => {})
  }

  const ext = file.name.split('.').pop() ?? 'mp4'
  const key = `videos/result-${resultId}-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await uploadFile(key, buffer, file.type || 'video/mp4')

  await sql`UPDATE athlete_results SET video_s3_key = ${key}, video_name = ${file.name} WHERE id = ${resultId}`

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { resultId } = await params
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') ?? 'view'

  const isAdmin = (session.user as any).is_admin === true
  const rows = isAdmin
    ? await sql`SELECT * FROM athlete_results WHERE id = ${resultId}`
    : await sql`SELECT * FROM athlete_results WHERE id = ${resultId} AND user_id = ${session.user.id}`

  if (!rows.length || !rows[0].video_s3_key) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const url = mode === 'download'
    ? await getSignedDownloadUrl(rows[0].video_s3_key, rows[0].video_name || 'video.mp4')
    : await getSignedViewUrl(rows[0].video_s3_key)

  return NextResponse.json({ url })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { resultId } = await params

  const rows = await sql`SELECT * FROM athlete_results WHERE id = ${resultId} AND user_id = ${session.user.id}`
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (rows[0].video_s3_key) {
    await deleteFile(rows[0].video_s3_key).catch(() => {})
  }
  await sql`UPDATE athlete_results SET video_s3_key = '', video_name = '' WHERE id = ${resultId}`

  return NextResponse.json({ ok: true })
}
