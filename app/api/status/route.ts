// app/api/status/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  if (!email && !token) {
    return NextResponse.json({ error: 'Provide email or token' }, { status: 400 })
  }

  const supabase = createAdminClient() as any

  let query = supabase
    .from('stories')
    .select('id, title, status, location_name, created_at, author_name, submission_token')

  if (token) {
    query = query.eq('submission_token', token)
  } else {
    query = query.eq('author_email', email!.toLowerCase().trim())
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    stories: (data ?? []).map(s => ({
      found: true,
      status: s.status,
      title: s.title,
      location_name: s.location_name,
      created_at: s.created_at,
      author_name: s.author_name,
    }))
  })
}
