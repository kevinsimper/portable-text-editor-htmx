import type { BlockObjectDefinition } from '@portabletext/editor'

export type MediaKind = 'image' | 'video'
export type MediaFields = { src: string; alt: string; caption: string }

export const mediaBlockDefinitions: BlockObjectDefinition[] = [
  'image',
  'video',
].map((name) => ({
  name,
  fields: [
    { name: 'src', type: 'string' },
    { name: 'alt', type: 'string' },
    { name: 'caption', type: 'string' },
    { name: 'mimeType', type: 'string' },
  ],
}))

export function mediaFields(input: unknown): MediaFields {
  const value =
    input !== null && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {}
  return {
    src: typeof value.src === 'string' ? value.src : '',
    alt: typeof value.alt === 'string' ? value.alt : '',
    caption: typeof value.caption === 'string' ? value.caption : '',
  }
}

export function safeMediaSource(value: string): string | undefined {
  const src = value.trim()
  if (!src || /[\\\u0000-\u001f\u007f]/.test(src)) return undefined
  try {
    const url = new URL(src, 'https://portable-text.invalid/')
    if (url.protocol === 'http:' || url.protocol === 'https:') return src
  } catch {
    return undefined
  }
  return undefined
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        character
      ]!,
  )
}

export function renderMediaHtml(
  kind: MediaKind,
  value: Record<string, unknown>,
): string {
  const fields = mediaFields(value)
  const source = safeMediaSource(fields.src)
  if (!source) return ''
  const src = escapeHtml(source)
  const alt = escapeHtml(fields.alt)
  const caption = fields.caption
    ? `<figcaption>${escapeHtml(fields.caption)}</figcaption>`
    : ''
  const media =
    kind === 'video'
      ? `<video src="${src}" controls playsinline preload="metadata" aria-label="${alt}"><a href="${src}">Download video</a></video>`
      : `<img src="${src}" alt="${alt}" loading="lazy">`
  return `<figure>${media}${caption}</figure>`
}
