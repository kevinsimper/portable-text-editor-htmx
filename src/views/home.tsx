import { toHTML } from '@portabletext/to-html'
import type { PortableTextBlock } from '@portabletext/types'
import { raw } from 'hono/html'
import { Layout } from './layout'

type ImageBlock = {
  _type: 'image'
  src?: string
  alt?: string
}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => {
    if (char === '&') return '&amp;'
    if (char === '<') return '&lt;'
    if (char === '>') return '&gt;'
    if (char === '"') return '&quot;'
    return '&#x27;'
  })

export const Home = ({ saved }: { saved: PortableTextBlock[] | undefined }) => {
  const savedHtml =
    saved && saved.length > 0
      ? toHTML(saved, {
          components: {
            types: {
              image: ({ value }) => {
                const image = value as ImageBlock
                if (!image.src) return ''
                const src = escapeHtml(image.src)
                const alt = escapeHtml(image.alt ?? '')
                return `<figure><img src="${src}" alt="${alt}">${
                  image.alt ? `<figcaption>${alt}</figcaption>` : ''
                }</figure>`
              },
            },
          },
        })
      : null
  const initialJson = JSON.stringify(saved ?? [])

  return (
    <Layout title="Portable Text Editor">
      <h1>Portable Text Editor</h1>
      <p>Hono SSR + Portable Text Editor POC.</p>

      <h2>Saved content</h2>
      <div class="saved">
        {savedHtml ? raw(savedHtml) : <em>Nothing saved yet.</em>}
      </div>

      <h2>Editor</h2>
      <form method="post" action="/save">
        <portable-text-editor name="value" data-initial={initialJson}></portable-text-editor>
        <button type="submit">Save</button>
      </form>

      {saved && (
        <>
          <h2>Raw Portable Text</h2>
          <pre>{JSON.stringify(saved, null, 2)}</pre>
        </>
      )}
    </Layout>
  )
}
