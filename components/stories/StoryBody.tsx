'use client'
// components/stories/StoryBody.tsx
// Renders story body text with drop cap, pull quotes, and inline image support.
// Story body can use special markers:
//   [PULLQUOTE] text [/PULLQUOTE]  → rendered as a large pull quote
//   [IMAGE url] caption [/IMAGE]   → rendered as a breakout image

interface Props {
  body: string
  accentColor: string
}

export function StoryBody({ body, accentColor }: Props) {
  const segments = parseBody(body)

  return (
    <div className="story-body">
      {segments.map((seg, i) => {
        if (seg.type === 'pullquote') {
          return (
            <PullQuote key={i} text={seg.content} color={accentColor} />
          )
        }
        if (seg.type === 'image') {
          return (
            <BreakoutImage key={i} url={seg.url!} caption={seg.content} />
          )
        }
        // Regular paragraph(s)
        const paragraphs = seg.content.split(/\n\n+/).filter(Boolean)
        return (
          <div key={i}>
            {paragraphs.map((para, j) => {
              // First paragraph of first segment gets a drop cap
              const isFirst = i === 0 && j === 0
              return (
                <p
                  key={j}
                  className={isFirst ? 'first-para' : ''}
                  style={{
                    fontSize: '1.125rem',
                    lineHeight: '1.85',
                    color: '#cbd5e1',
                    marginBottom: '1.6em',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {isFirst ? (
                    <>
                      <span
                        className="float-left font-display font-bold leading-none mr-2 mt-1"
                        style={{
                          fontSize: '4.5rem',
                          lineHeight: '0.8',
                          color: accentColor,
                        }}
                      >
                        {para.charAt(0)}
                      </span>
                      {para.slice(1)}
                    </>
                  ) : para}
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function PullQuote({ text, color }: { text: string; color: string }) {
  return (
    <blockquote
      className="my-12 px-0 py-2 relative"
      style={{ borderLeft: 'none' }}
    >
      {/* Decorative open quote */}
      <div
        className="font-display absolute -top-4 -left-2 text-8xl leading-none select-none pointer-events-none opacity-20"
        style={{ color }}
      >
        &ldquo;
      </div>
      <p
        className="font-display italic relative z-10 pl-6"
        style={{
          fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)',
          lineHeight: 1.4,
          color: '#f1f5f9',
          borderLeft: `3px solid ${color}`,
          paddingLeft: '1.5rem',
        }}
      >
        {text.trim()}
      </p>
    </blockquote>
  )
}

function BreakoutImage({ url, caption }: { url: string; caption: string }) {
  return (
    <figure className="my-12 -mx-6 lg:-mx-16">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={caption}
        className="w-full object-cover"
        style={{ maxHeight: '60vh' }}
        loading="lazy"
      />
      {caption && (
        <figcaption className="px-6 lg:px-16 mt-3 text-ink-500 text-xs font-mono">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

// ── Parser ───────────────────────────────────────────────────
type Segment =
  | { type: 'text'; content: string; url?: undefined }
  | { type: 'pullquote'; content: string; url?: undefined }
  | { type: 'image'; content: string; url: string }

function parseBody(raw: string): Segment[] {
  const segments: Segment[] = []
  let remaining = raw

  while (remaining.length > 0) {
    // Check for [PULLQUOTE]
    const pqStart = remaining.indexOf('[PULLQUOTE]')
    const imgStart = remaining.indexOf('[IMAGE')

    // Find the next special tag
    const nextSpecial = Math.min(
      pqStart >= 0 ? pqStart : Infinity,
      imgStart >= 0 ? imgStart : Infinity
    )

    if (nextSpecial === Infinity) {
      // No more special tags — rest is plain text
      if (remaining.trim()) segments.push({ type: 'text', content: remaining })
      break
    }

    // Push text before the tag
    if (nextSpecial > 0) {
      const before = remaining.slice(0, nextSpecial)
      if (before.trim()) segments.push({ type: 'text', content: before })
    }

    if (nextSpecial === pqStart) {
      const end = remaining.indexOf('[/PULLQUOTE]', pqStart)
      if (end === -1) { remaining = remaining.slice(pqStart + 11); continue }
      const content = remaining.slice(pqStart + 11, end)
      segments.push({ type: 'pullquote', content })
      remaining = remaining.slice(end + 12)
    } else {
      // [IMAGE url] caption [/IMAGE]
      const tagEnd = remaining.indexOf(']', imgStart)
      const end = remaining.indexOf('[/IMAGE]', imgStart)
      if (tagEnd === -1 || end === -1) { remaining = remaining.slice(imgStart + 6); continue }
      const url = remaining.slice(imgStart + 7, tagEnd).trim()
      const caption = remaining.slice(tagEnd + 1, end).trim()
      segments.push({ type: 'image', content: caption, url })
      remaining = remaining.slice(end + 8)
    }
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: raw }]
}
