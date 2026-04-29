# portable-text-editor-htmx

Use the [Portable Text Editor](https://www.portabletext.org/editor/) in any server-rendered HTML app via a single `<script>` tag and a `<portable-text-editor>` custom element.

**[Try it live →](https://kevinsimper.github.io/portable-text-editor-htmx/)**

## Why

The Portable Text Editor only ships as a React component, but plenty of stacks (Hono, htmx, Rails, Django, plain PHP, …) are server-rendered and don't want a full SPA build just to author rich text.

This project bundles the editor as a self-contained IIFE that registers a custom element. Drop in a `<script>` tag and you can author Portable Text inside a normal HTML form. htmx swaps work for free because `connectedCallback` fires every time the element is inserted into the DOM.

The repo also includes a tiny [Hono](https://hono.dev/) demo server that round-trips saved Portable Text and renders it back to HTML using `@portabletext/to-html`.

## Quick start

```bash
bun install
bun run dev
```

Open <http://localhost:3000>. Type something, toggle some styles, click **Save** — the saved content renders above the editor as real HTML.

## Install (CDN)

No build step. Drop one `<script>` from [esm.sh](https://esm.sh/) into any HTML page:

```html
<script
  src="https://esm.sh/gh/kevinsimper/portable-text-editor-htmx@main/public/client.js?raw"
  defer
></script>

<portable-text-editor name="content" data-initial="[]"></portable-text-editor>
```

`@main` follows the latest commit. **For production, pin to a tagged release** (e.g. `@v0.1.0`) or a commit SHA so the bundle is immutable.

Live demo: <https://kevinsimper.github.io/portable-text-editor-htmx/>

## Use it in your own app

```html
<script src="/portable-text-editor.js" defer></script>

<form method="post" action="/save">
  <portable-text-editor name="content" data-initial="[]"></portable-text-editor>
  <button type="submit">Save</button>
</form>
```

That's it. The custom element renders the editor, and a hidden `<input name="content">` is kept in sync with the editor's current value. Standard form submission carries the Portable Text JSON to your server.

## Server-side: render saved Portable Text

Use [`@portabletext/to-html`](https://www.npmjs.com/package/@portabletext/to-html) on the server:

```ts
import { toHTML } from '@portabletext/to-html'

const html = toHTML(savedBlocks)
```

See `src/views/home.tsx` for a working example.

## API

### Attributes

| Attribute      | Description                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `name`         | Form field name. When set, an internal hidden input participates in form submission with the editor value. |
| `data-initial` | JSON-encoded `PortableTextBlock[]` to seed the editor with existing content.                               |

### Events

The element dispatches `pte:change` on every editor mutation. The event's `detail` is the current Portable Text value.

```js
document.querySelector('portable-text-editor').addEventListener('pte:change', (e) => {
  console.log(e.detail)
})
```

For htmx, you can wire it up directly:

```html
<div hx-post="/autosave" hx-trigger="pte:change from:closest portable-text-editor delay:500ms">
  <portable-text-editor name="content"></portable-text-editor>
</div>
```

### Imperative API

If you need to mount the editor outside a custom element:

```js
const unmount = window.PortableTextEditor.mount(el, {
  initial: [...],
  onChange: (value) => { /* ... */ },
})
```

## How it works

1. `esbuild` produces an IIFE bundle from `src/client/editor.tsx`.
2. The bundle registers a `<portable-text-editor>` custom element.
3. `connectedCallback` mounts a React island (PTE + toolbar) inside the element.
4. A `useEditorSelector(getValue)` subscription syncs the hidden input to the editor's xstate snapshot on every transition — fast enough that "type, toggle a style, immediately submit" works without a race.

## Project layout

```
.
├── build.mjs              # esbuild config (IIFE, minified)
├── src/
│   ├── server.tsx         # Hono app entry
│   ├── store.ts           # in-memory store (POC)
│   ├── views/
│   │   ├── layout.tsx
│   │   └── home.tsx
│   └── client/
│       └── editor.tsx     # custom element + React island
└── public/
    └── client.js          # built bundle (committed for drop-in use)
```

## Bundle size

832 KB minified, **251 KB gzipped**. React + xstate + Slate + PTE all together. Lazy-load if your page is latency-sensitive.

## Limitations (POC scope)

- In-memory store; restart loses content. Swap `src/store.ts` for SQLite / a real DB.
- Schema covers basic styles (`normal`, `h1–h3`, `blockquote`) and decorators (`strong`, `em`, `underline`). Annotations, inline objects, and block objects are stubbed but not wired up.
- Requires React 19 (PTE peer dependency).
- No auth, no multi-document.

## License

MIT
