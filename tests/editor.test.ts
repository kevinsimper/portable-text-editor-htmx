import { afterEach, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { Window } from 'happy-dom'

let bundle: string
const windows: Window[] = []

before(async () => {
  const result = await build({
    entryPoints: ['src/client/editor.tsx'],
    bundle: true,
    format: 'iife',
    globalName: 'PortableTextEditor',
    write: false,
    jsx: 'automatic',
    jsxImportSource: 'react',
    define: { 'process.env.NODE_ENV': '"production"' },
  })
  bundle = result.outputFiles[0]!.text
})
afterEach(async () => {
  for (const window of windows.splice(0)) await window.happyDOM.close()
})

async function waitFor(check: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (check()) return
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error('Editor state did not update')
}

function mount(initial: unknown[]) {
  const window = new Window({
    url: 'https://editor.test/',
    settings: {
      enableJavaScriptEvaluation: true,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
    },
  })
  windows.push(window)
  const form = window.document.createElement('form')
  const element = window.document.createElement('portable-text-editor')
  element.setAttribute('name', 'content')
  element.setAttribute('data-initial', JSON.stringify(initial))
  form.append(element)
  window.document.body.append(form)
  const value = (): Record<string, unknown>[] =>
    JSON.parse(
      element.querySelector<HTMLInputElement>('input[name="content"]')!.value,
    )
  const changes: { eventValue: string; formValue: string }[] = []
  element.addEventListener('pte:change', (event) => {
    changes.push({
      eventValue: JSON.stringify((event as CustomEvent).detail),
      formValue: JSON.stringify(value()),
    })
  })
  window.eval(bundle)
  return { window, form, element, value, changes }
}

const paragraph = {
  _type: 'block',
  _key: 'intro',
  style: 'normal',
  markDefs: [],
  children: [
    { _type: 'span', _key: 'text', marks: [], text: 'A taxi article' },
  ],
}

test('native image/video descriptions and captions survive initialization and form submission', async () => {
  const initial = [
    paragraph,
    {
      _type: 'image',
      _key: 'photo',
      src: '/photo.jpg',
      alt: 'A taxi',
      caption: 'Image caption',
    },
    {
      _type: 'video',
      _key: 'clip',
      src: '/clip.mp4',
      alt: 'A taxi arriving',
      caption: 'Video caption',
      mimeType: 'video/mp4',
    },
  ]
  const { window, form, element, value, changes } = mount(initial)
  await waitFor(() => Boolean(element.querySelector('video')))
  assert.equal(element.querySelector('video')!.getAttribute('src'), '/clip.mp4')
  assert.equal(element.querySelector('video')!.hasAttribute('controls'), true)
  assert.equal(element.querySelectorAll('figcaption').length, 2)
  assert.deepEqual(value(), initial)
  assert.ok(changes.length > 0)
  for (const change of changes)
    assert.equal(change.eventValue, change.formValue)
  assert.deepEqual(
    JSON.parse(String(new window.FormData(form).get('content'))),
    initial,
  )
})

test('inserts a native video with a description and caption through the toolbar', async () => {
  const { window, element, value } = mount([paragraph])
  await waitFor(() =>
    Boolean(element.querySelector('button[aria-label="Video"]')),
  )
  await waitFor(() => Boolean(element.querySelector('.pte-editable')))
  const editable = element.querySelector<HTMLElement>('.pte-editable')!
  editable.focus()
  await waitFor(() => Boolean(element.querySelector('[data-slate-string]')))
  const text = element.querySelector('[data-slate-string]')!.firstChild!
  const range = window.document.createRange()
  range.setStart(text, text.textContent!.length)
  range.collapse(true)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
  window.document.dispatchEvent(new window.Event('selectionchange'))
  await waitFor(
    () =>
      !element.querySelector<HTMLButtonElement>('button[aria-label="Video"]')!
        .disabled,
  )
  element
    .querySelector<HTMLButtonElement>('button[aria-label="Video"]')!
    .click()
  await waitFor(() =>
    Boolean(element.querySelector('[aria-label="Insert video"]')),
  )
  function fill(label: string, text: string): void {
    const input = element.querySelector<HTMLInputElement>(
      `input[aria-label="${label}"]`,
    )!
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )!.set!
    setter.call(input, text)
    input.dispatchEvent(new window.Event('input', { bubbles: true }))
  }
  fill('Video URL', '/new-clip.mp4')
  await new Promise((resolve) => setTimeout(resolve, 0))
  fill('Video description', 'Taxi driving into the workshop')
  await new Promise((resolve) => setTimeout(resolve, 0))
  fill('Video caption', 'Ready for service in København')
  await new Promise((resolve) => setTimeout(resolve, 0))
  const insert = [
    ...element.querySelectorAll<HTMLButtonElement>(
      '[aria-label="Insert video"] button',
    ),
  ].find((button) => button.textContent === 'Insert')!
  insert.click()
  await waitFor(() => value().some((block) => block._type === 'video'))
  const video = value().find((block) => block._type === 'video')!
  assert.deepEqual(
    { src: video.src, alt: video.alt, caption: video.caption },
    {
      src: '/new-clip.mp4',
      alt: 'Taxi driving into the workshop',
      caption: 'Ready for service in København',
    },
  )
  assert.equal(
    element.querySelector('video')!.getAttribute('src'),
    '/new-clip.mp4',
  )
})

test('edits a selected caption through the native controls and submits it immediately', async () => {
  const { window, form, element, value } = mount([
    paragraph,
    {
      _type: 'image',
      _key: 'photo',
      src: '/photo.jpg',
      alt: 'A taxi',
      caption: 'Before',
    },
  ])
  await waitFor(() => Boolean(element.querySelector('img')))
  await waitFor(() =>
    [...element.querySelectorAll('button')].some(
      (button) => button.textContent === 'Edit image',
    ),
  )
  ;[...element.querySelectorAll<HTMLButtonElement>('button')]
    .find((button) => button.textContent === 'Edit image')!
    .click()
  await waitFor(() =>
    Boolean(element.querySelector('[aria-label="Edit image"]')),
  )
  const input = element.querySelector<HTMLInputElement>(
    '[aria-label="Edit image"] input[aria-label="Image caption"]',
  )!
  input.focus()
  Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )!.set!.call(input, 'Changed caption in København')
  input.dispatchEvent(new window.Event('input', { bubbles: true }))
  await waitFor(
    () =>
      value().find((block) => block._key === 'photo')?.caption ===
      'Changed caption in København',
  )
  const submitted = JSON.parse(
    String(new window.FormData(form).get('content')),
  ) as Record<string, unknown>[]
  assert.equal(
    submitted.find((block) => block._key === 'photo')?.caption,
    'Changed caption in København',
  )
  assert.equal(
    element.querySelector('figcaption')?.textContent,
    'Changed caption in København',
  )
  element
    .querySelector<HTMLButtonElement>('button[aria-label="Remove image"]')!
    .click()
  await waitFor(() => !value().some((block) => block._key === 'photo'))
  assert.equal(element.querySelector('img'), null)
})
