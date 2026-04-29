import { toHTML } from '@portabletext/to-html'
import type { PortableTextBlock } from '@portabletext/to-html'
import { raw } from 'hono/html'
import { Layout } from './layout'

export const Home = ({ saved }: { saved: PortableTextBlock[] | undefined }) => {
  const savedHtml = saved && saved.length > 0 ? toHTML(saved) : null
  const initialJson = JSON.stringify(saved ?? [])

  return (
    <Layout title="eventual-sloth">
      <h1>eventual-sloth</h1>
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
