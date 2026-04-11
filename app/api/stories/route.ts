// @ts-nocheck
// app/api/stories/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const country  = searchParams.get('country')
  const view     = searchParams.get('view') ?? 'map'   // 'map' | 'full'

  const supabase = await createServerSupabaseClient()

  // Lightweight map pins
  if (view === 'map') {
    let query = supabase
      .from('map_stories')
      .select('*')
      .order('created_at', { ascending: false })

    if (category) query = query.eq('category', category)
    if (country)  query = query.eq('country_code', country.toUpperCase())

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=300' }
    })
  }

  // Full stories list
  let query = supabase
    .from('stories')
    .select('id,title,excerpt,category,cover_image_url,location_name,country_name,country_code,author_name,created_at,tags,featured')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(48)

  if (category) query = query.eq('category', category)
  if (country)  query = query.eq('country_code', country.toUpperCase())

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=120, stale-while-revalidate=300' }
  })
}
