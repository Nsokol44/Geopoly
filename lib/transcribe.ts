// lib/transcribe.ts
// Speech-to-text for voice stories (OpenAI Whisper API).
//
// Every voice story should carry its text: the story page, the
// cards, and search all read `transcript`/`body`. Transcription
// runs automatically on submission when OPENAI_API_KEY is set,
// and an admin can (re)run it per story — or for every pending
// story at once — from the review queue. Without the key the
// feature is simply off and the manual paste-in flow remains.

export const PENDING_TRANSCRIPT = '[Voice recording — pending transcription]'

export function transcriptionConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

export function needsTranscript(story: { transcript?: string | null; audio_upload_path?: string | null }): boolean {
  if (!story.audio_upload_path) return false
  const t = (story.transcript ?? '').trim()
  return t === '' || t === PENDING_TRANSCRIPT
}

/** One Whisper call. Throws Error with a readable message. */
export async function transcribeAudio(
  bytes: Uint8Array,
  filename: string,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('Transcription is not configured (OPENAI_API_KEY is missing)')

  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(bytes)]), filename)
  form.append('model', 'whisper-1')
  form.append('response_format', 'json')

  const res = await fetchFn('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Transcription failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`)
  }
  const json = (await res.json()) as { text?: string }
  const text = (json.text ?? '').trim()
  if (!text) throw new Error('Transcription returned no text')
  return text
}

/**
 * Download a story's audio from storage, transcribe it, and save
 * the text onto the story (transcript + body; excerpt too on the
 * legacy schema, best-effort). Returns the transcript text.
 * `db` is a Supabase service-role client.
 */
export async function transcribeStory(db: any, storyId: string): Promise<string> {
  const { data: story, error } = await db
    .from('stories')
    .select('id, audio_upload_path')
    .eq('id', storyId)
    .single()
  if (error || !story) throw new Error('Story not found')
  if (!story.audio_upload_path) throw new Error('Story has no audio recording')

  const { data: blob, error: dlError } = await db.storage.from('story-media').download(story.audio_upload_path)
  if (dlError || !blob) throw new Error('Could not download the story audio')

  const bytes = new Uint8Array(await blob.arrayBuffer())
  const filename = story.audio_upload_path.split('/').pop() ?? 'audio.webm'
  const text = await transcribeAudio(bytes, filename)

  const { error: upError } = await db
    .from('stories')
    .update({ transcript: text, body: text })
    .eq('id', storyId)
  if (upError) throw new Error(`Could not save the transcript: ${upError.message}`)

  // Legacy live schema also carries a NOT NULL-era `excerpt`
  // column; freshen it where it exists, ignore where it doesn't.
  await db.from('stories').update({ excerpt: text.slice(0, 200) }).eq('id', storyId)

  return text
}
