// app/api/submit/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validation
    const required = ['title', 'excerpt', 'body', 'category', 'latitude', 'longitude', 'location_name', 'country_code', 'country_name', 'author_name']
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

    // Email is optional — only validate format if provided
    if (body.author_email) {
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRx.test(body.author_email)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
      }
    }

    const adminDb = createAdminClient()
    const { data, error } = await adminDb
      .from('stories')
      .insert({
        title:              body.title.trim(),
        excerpt:            body.excerpt.trim(),
        body:               body.body.trim(),
        category:           body.category,
        cover_image_url:    body.cover_image_url    ?? null,
        video_url:          body.video_url          ?? null,
        video_upload_path:  body.video_upload_path  ?? null,
        audio_upload_path:  body.audio_upload_path  ?? null,
        latitude:           body.latitude,
        longitude:          body.longitude,
        location_name:      body.location_name.trim(),
        country_code:       body.country_code.trim().toUpperCase(),
        country_name:       body.country_name.trim(),
        author_name:        body.author_name.trim(),
        author_email:       body.author_email?.trim().toLowerCase() ?? '',
        author_bio:         body.author_bio?.trim()  ?? null,
        age_range:          body.age_range           ?? null,
        submitted_for:      body.submitted_for       ?? null,
        tags:               body.tags                ?? [],
        status:             'pending',
      })
      .select('id, submission_token')
      .single()

    if (error) {
      console.error('Story insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data.id, token: data.submission_token }, { status: 201 })
  } catch (e) {
    console.error('Submit route error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
