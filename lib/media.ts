// lib/media.ts
// The live `story-media` bucket is PRIVATE, so the public
// storage URLs the app used to hand to <audio>/<img> tags
// return 400 "Bucket not found" and nothing plays or renders.
// Media is therefore streamed through our own routes using the
// service role. Shared helpers for those routes live here.

export const AUDIO_TYPES: Record<string, string> = {
  webm: 'audio/webm',
  mp4: 'audio/mp4',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
}

export const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
}

/** Storage path inside `story-media` from a stored public URL, or null. */
export function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const marker = '/story-media/'
  const idx = url.indexOf(marker)
  if (idx < 0) return null
  const path = decodeURIComponent(url.slice(idx + marker.length)).split('?')[0]
  return path && !path.includes('..') ? path : null
}

/** True when a stored cover URL points at our own bucket. */
export function isBucketUrl(url: string | null | undefined): boolean {
  return storagePathFromUrl(url) !== null
}

/**
 * The URL the UI should use for a story's cover: our streaming
 * route for bucket files, the original URL for external images.
 */
export function coverSrc(story: { id: string; cover_image_url: string | null }): string | null {
  if (!story.cover_image_url) return null
  return isBucketUrl(story.cover_image_url) ? `/api/cover/${story.id}` : story.cover_image_url
}
