// lib/convert-client.ts
// Browser-side WebM/MP4 → MP3 conversion (ffmpeg.wasm,
// single-thread core loaded from CDN — no server ffmpeg, so
// nothing heavy ships to Vercel). MP3 plays everywhere,
// including every Safari; WebM/Opus does not. Conversion is
// best-effort: callers fall back to the original recording if
// anything here fails.

let ffmpegPromise: Promise<any> | null = null

async function loadFfmpeg(): Promise<any> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const ffmpeg = new FFmpeg()
      const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      await ffmpeg.load({ coreURL: `${base}/ffmpeg-core.js`, wasmURL: `${base}/ffmpeg-core.wasm` })
      return ffmpeg
    })()
  }
  return ffmpegPromise
}

export function isMp3Name(name: string | null | undefined): boolean {
  return !!name && name.toLowerCase().endsWith('.mp3')
}

/** Convert an audio Blob to MP3. Throws on failure — caller falls back. */
export async function convertToMp3(blob: Blob, inputExt = 'webm'): Promise<Blob> {
  const { fetchFile } = await import('@ffmpeg/util')
  const ffmpeg = await loadFfmpeg()
  const input = `input.${inputExt.replace(/[^a-z0-9]/gi, '') || 'webm'}`
  const output = 'output.mp3'
  await ffmpeg.writeFile(input, await fetchFile(blob))
  const code = await ffmpeg.exec(['-i', input, '-vn', '-codec:a', 'libmp3lame', '-q:a', '4', output])
  if (code !== 0) throw new Error(`Audio conversion failed (${code})`)
  const data = await ffmpeg.readFile(output)
  await ffmpeg.deleteFile(input).catch(() => {})
  await ffmpeg.deleteFile(output).catch(() => {})
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data as Uint8Array)
  return new Blob([new Uint8Array(bytes)], { type: 'audio/mpeg' })
}

/**
 * Admin flow: fetch a story's original recording through the
 * admin audio route, convert it here in the browser, and hand
 * the MP3 to /api/admin/convert to store. Returns the new
 * storage path.
 */
export async function convertStoryAudio(storyId: string, audioPath: string): Promise<string> {
  const res = await fetch(`/api/admin/audio?path=${encodeURIComponent(audioPath)}&download=1`)
  if (!res.ok) throw new Error('Could not fetch the original recording')
  const original = await res.blob()
  const ext = audioPath.split('.').pop() ?? 'webm'
  const mp3 = await convertToMp3(original, ext)
  const form = new FormData()
  form.append('id', storyId)
  form.append('file', mp3, 'story.mp3')
  const up = await fetch('/api/admin/convert', { method: 'POST', body: form })
  const json = await up.json().catch(() => ({}))
  if (!up.ok) throw new Error(json.error ?? 'Could not save the converted audio')
  return json.path as string
}
