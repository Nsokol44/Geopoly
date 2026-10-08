// lib/story-submit.ts
// Insert a story across the project's two historical schemas.
//
// The live database follows migration 001 (the Geopoly schema):
// excerpt, category, latitude, longitude, location_name,
// country_code and country_name are all NOT NULL there — but the
// voice-story form collects none of them, so a plain insert dies
// with: null value in column "excerpt" ... violates not-null
// constraint. The schema.sql schema has none of those columns at
// all, where sending them dies the opposite way.
//
// Strategy: start from what the form actually knows (plus
// excerpt, derived from the title), and let the database tell us
// what else it demands —
//   * not-null violation for column X  -> fill X with a neutral
//     default and retry;
//   * column X not in the schema cache -> drop X and retry.
// Bounded retries, deterministic defaults. On a database that
// has run migration 005 (which drops those legacy NOT NULLs) the
// first attempt succeeds and no placeholder geo/category values
// are ever written.

export interface StoryDraft {
  title: string
  author_name: string
  author_email?: string | null
  audio_upload_path?: string | null
  cover_image_url?: string | null
  // Country-level location only (product rule): when the
  // teller picks a country, the submit route resolves its
  // centroid and passes it here as latitude/longitude.
  country_code?: string | null
  country_name?: string | null
  latitude?: number | null
  longitude?: number | null
}

type Row = Record<string, unknown>

function legacyDefaults(draft: StoryDraft): Record<string, () => unknown> {
  return {
    excerpt: () => draft.title.slice(0, 160),
    category: () => 'built_human',
    latitude: () => 0,
    longitude: () => 0,
    location_name: () => '',
    country_code: () => '',
    country_name: () => '',
    author_email: () => '',
    body: () => '[Voice recording — pending transcription]',
    tags: () => [],
  }
}

/** Column a PostgREST/Postgres error is complaining about, if any. */
export function columnFromError(message: string): { column: string; kind: 'not-null' | 'missing' } | null {
  let m = message.match(/null value in column "([^"]+)"/)
  if (m) return { column: m[1], kind: 'not-null' }
  m = message.match(/Could not find the '([^']+)' column/)
  if (m) return { column: m[1], kind: 'missing' }
  m = message.match(/column "([^"]+)" of relation "[^"]+" does not exist/)
  if (m) return { column: m[1], kind: 'missing' }
  return null
}

type AdminDb = ReturnType<typeof import('./supabase-server').createAdminClient>

export async function insertStory(db: AdminDb, draft: StoryDraft): Promise<string> {
  const defaults = legacyDefaults(draft)
  const payload: Row = {
    title: draft.title,
    body: '[Voice recording — pending transcription]',
    audio_upload_path: draft.audio_upload_path ?? null,
    cover_image_url: draft.cover_image_url ?? null,
    author_name: draft.author_name,
    author_email: String(draft.author_email ?? '').trim().toLowerCase(),
    status: 'pending',
    // Present in the migration-001 schema and useful everywhere it
    // exists; stripped automatically where it does not.
    excerpt: draft.title.slice(0, 160),
    // Real country data when the teller provided it — written on
    // the first attempt, so no placeholder geo is stored.
    ...(draft.country_code ? { country_code: draft.country_code } : {}),
    ...(draft.country_name ? { country_name: draft.country_name } : {}),
    ...(typeof draft.latitude === 'number' ? { latitude: draft.latitude } : {}),
    ...(typeof draft.longitude === 'number' ? { longitude: draft.longitude } : {}),
  }

  const filled = new Set<string>()
  const stripped = new Set<string>()

  for (let attempt = 0; attempt < 12; attempt++) {
    const { data, error } = await db.from('stories').insert(payload).select('id').single()
    if (!error && data) return data.id as string

    const parsed = columnFromError(error?.message ?? '')
    if (!parsed) throw new Error(error?.message ?? 'Story insert failed')

    if (parsed.kind === 'not-null') {
      const make = defaults[parsed.column]
      if (!make || filled.has(parsed.column)) {
        throw new Error(error?.message ?? 'Story insert failed')
      }
      filled.add(parsed.column)
      payload[parsed.column] = make()
    } else {
      if (!(parsed.column in payload) || stripped.has(parsed.column)) {
        throw new Error(error?.message ?? 'Story insert failed')
      }
      stripped.add(parsed.column)
      delete payload[parsed.column]
    }
  }
  throw new Error('Story insert failed: schema keeps rejecting the row')
}
