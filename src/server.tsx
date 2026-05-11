import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import type { PortableTextBlock } from '@portabletext/types'
import { Home } from './views/home'
import { getSaved, setSaved } from './store'

const app = new Hono()

app.use('/public/*', serveStatic({ root: './' }))

app.get('/', (c) => {
  return c.html(<Home saved={getSaved()} />)
})

app.post('/save', async (c) => {
  const body = await c.req.parseBody()
  const raw = body.value
  if (typeof raw !== 'string') {
    return c.text('Missing value', 400)
  }
  let parsed: PortableTextBlock[]
  try {
    parsed = JSON.parse(raw) as PortableTextBlock[]
  } catch {
    return c.text('Invalid JSON', 400)
  }
  setSaved(parsed)
  return c.redirect('/')
})

export default {
  port: 3000,
  fetch: app.fetch,
}
