import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  mediaBlockDefinitions,
  mediaFields,
  renderMediaHtml,
  safeMediaSource,
} from '../src/media.ts'

describe('native media blocks', () => {
  test('declares image and video captions in the editor schema', () => {
    assert.deepEqual(
      mediaBlockDefinitions.map((definition) => definition.name),
      ['image', 'video'],
    )
    for (const definition of mediaBlockDefinitions) {
      assert.deepEqual(
        definition.fields?.map((field) => field.name),
        ['src', 'alt', 'caption', 'mimeType'],
      )
    }
  })

  test('reads older images without inventing a caption from their alt text', () => {
    assert.deepEqual(mediaFields({ src: '/photo.jpg', alt: 'A taxi' }), {
      src: '/photo.jpg',
      alt: 'A taxi',
      caption: '',
    })
    assert.ok(
      !renderMediaHtml('image', { src: '/photo.jpg', alt: 'A taxi' }).includes(
        'figcaption',
      ),
    )
  })

  test('renders playable video with separate escaped description and caption', () => {
    const html = renderMediaHtml('video', {
      src: '/taxi.mp4',
      alt: 'Taxi "onerror="unsafe',
      caption: '<script>unsafe()</script> & København',
    })
    assert.ok(html.includes('<video src="/taxi.mp4" controls playsinline'))
    assert.ok(html.includes('aria-label="Taxi &quot;onerror=&quot;unsafe"'))
    assert.ok(
      html.includes(
        '<figcaption>&lt;script&gt;unsafe()&lt;/script&gt; &amp; København</figcaption>',
      ),
    )
    assert.ok(!html.includes('autoplay'))
  })

  test('allows relative and HTTP media sources and blocks unsafe protocols', () => {
    for (const src of [
      '/photo.jpg',
      './photo.jpg',
      'images/photo.jpg',
      'https://example.com/clip.mp4',
    ])
      assert.equal(safeMediaSource(src), src)
    for (const src of [
      '',
      'javascript:alert(1)',
      'data:text/html,unsafe',
      'file:///private/file',
      '/photo\n.jpg',
      '\\unsafe',
    ]) {
      assert.equal(safeMediaSource(src), undefined)
      assert.equal(renderMediaHtml('image', { src }), '')
    }
  })
})
