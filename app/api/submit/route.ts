// @ts-nocheck
// app/api/submit/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import type { StorySubmission } from '@/types'

export async function POST(req: Request) {
  try {
    const body: StorySubmission = await req.json()

    // ── Validation ─────────────────────────────────────
    const required: (keyof StorySubmission)[] = [
      'title', 'excerpt', 'body', 'category',
      'latitude', 'longitude', 'location_name',
      'country_code', 'country_name',
      'author_name', 'author_email',
    ]

    for (const field of required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const validCategories = ['energy_transition', 'nature_land', 'built_human', 'extreme_weather']
    if (!validCategories.includes(body.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    if (Math.abs(body.latitude) > 90 || Math.abs(body.longitude) > 180) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRx.test(body.author_email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (body.title.length > 200 || body.excerpt.length > 500 || body.body.length > 50000) {
      return NextResponse.json({ error: 'Content exceeds maximum length' }, { status: 400 })
    }

    // ── Insert ─────────────────────────────────────────
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('stories')
      .insert({
        title: body.title.trim(),
        excerpt: body.excerpt.trim(),
        body: body.body.trim(),
        category: body.category,
        cover_image_url: body.cover_image_url ?? null,
        video_url: body.video_url ?? null,
        video_upload_path: body.video_upload_path ?? null,
        latitude: body.latitude,
        longitude: body.longitude,
        location_name: body.location_name.trim(),
        country_code: body.country_code.trim().toUpperCase(),
        country_name: body.country_name.trim(),
        author_name: body.author_name.trim(),
        author_email: body.author_email.trim().toLowerCase(),
        author_bio: body.author_bio?.trim() ?? null,
        tags: body.tags ?? [],
        status: 'pending',
        audio_upload_path: body.audio_upload_path ?? null,
        age_range: body.age_range ?? null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Story insert error:', error)
      return NextResponse.json({ error: error.message ?? 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (e) {
    console.error('Submit route error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
