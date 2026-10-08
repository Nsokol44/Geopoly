// lib/range.ts
// Minimal HTTP Range parsing for media streaming. Pure + tested:
// iOS Safari's media stack will not play an <audio> element whose
// server cannot answer Range requests with 206 responses.

export interface ByteRange { start: number; end: number } // end inclusive

/**
 * Parse a single-range `Range: bytes=...` header against a known
 * total size. Returns null for no/invalid/multi-range headers —
 * callers then serve the full body (which is still valid HTTP).
 */
export function parseRange(header: string | null, size: number): ByteRange | null {
  if (!header || size <= 0) return null
  const m = header.match(/^bytes=(\d*)-(\d*)$/)
  if (!m) return null
  const [, first, last] = m
  if (first === '' && last === '') return null

  let start: number
  let end: number
  if (first === '') {
    // Suffix range: last N bytes
    const suffix = Number(last)
    if (!Number.isFinite(suffix) || suffix <= 0) return null
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    start = Number(first)
    end = last === '' ? size - 1 : Number(last)
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null
    if (start >= size) return null
    end = Math.min(end, size - 1)
    if (end < start) return null
  }
  return { start, end }
}
