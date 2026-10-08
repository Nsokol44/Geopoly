import { NextResponse, after } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { insertStory } from '@/lib/story-submit'
import { transcriptionConfigured, transcribeStory } from '@/lib/transcribe'
import { countryByCode } from '@/lib/countries'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    if (!body.title?.trim() || !body.author_name?.trim())
      return NextResponse.json({ error: 'Title and name required' }, { status: 400 })

    // Location is COUNTRY ONLY: the form sends a country code,
    // we store the country and pin the story at its centroid.
    const country = countryByCode(typeof body.country_code === 'string' ? body.country_code : null)

    const db = createAdminClient()
    const id = await insertStory(db, {
      title: body.title.trim(),
      author_name: body.author_name.trim(),
      author_email: body.author_email,
      audio_upload_path: body.audio_upload_path ?? null,
      cover_image_url: body.cover_image_url ?? null,
      country_code: country?.code ?? null,
      country_name: country?.name ?? null,
      latitude: country?.lat ?? null,
      longitude: country?.lng ?? null,
    })

    // Every voice story gets its text: transcribe in the
    // background once the response is sent (when configured).
    // Failure leaves the story "pending transcription" for the
    // admin queue's Transcribe button — submission never fails
    // because transcription did.
    if (body.audio_upload_path && transcriptionConfigured()) {
      after(async () => {
        try { await transcribeStory(db, id) } catch { /* retried from admin */ }
      })
    }

    return NextResponse.json({ id }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Internal server error' }, { status: 500 })
  }
}
