import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mediaDialogLayout } from '../src/client/media-dialog.ts'

test('centers the mobile dialog and keeps it inside phone and keyboard viewports', () => {
  for (const width of [320, 375, 390, 640]) {
    for (const height of [250, 500, 844]) {
      const viewport = { left: 0, top: 0, width, height }
      const panel = { width: Math.min(368, width - 32), height: 450 }
      const layout = mediaDialogLayout(
        { left: width - 50, top: 80, bottom: 120 },
        viewport,
        panel,
      )
      assert.ok(layout.left >= 16)
      assert.ok(layout.left + panel.width <= width - 16)
      assert.ok(layout.top >= 16)
      assert.ok(
        layout.top + Math.min(panel.height, layout.maxHeight) <= height - 16,
      )
      assert.equal(layout.left, (width - panel.width) / 2)
    }
  }
})

test('anchors desktop dialogs below the button and clamps the right edge', () => {
  assert.deepEqual(
    mediaDialogLayout(
      { left: 500, top: 90, bottom: 130 },
      { left: 0, top: 0, width: 1440, height: 900 },
      { width: 368, height: 450 },
    ),
    { left: 500, top: 138, maxHeight: 868 },
  )
  const nearEdge = mediaDialogLayout(
    { left: 1350, top: 90, bottom: 130 },
    { left: 0, top: 0, width: 1440, height: 900 },
    { width: 368, height: 450 },
  )
  assert.equal(nearEdge.left, 1440 - 368 - 16)
})

test('flips above the trigger when the lower desktop viewport has no room', () => {
  const layout = mediaDialogLayout(
    { left: 100, top: 700, bottom: 740 },
    { left: 0, top: 0, width: 1024, height: 800 },
    { width: 368, height: 450 },
  )
  assert.equal(layout.top, 242)
})

test('accounts for a panned mobile visual viewport and constrains tall dialogs', () => {
  const layout = mediaDialogLayout(
    { left: 100, top: 90, bottom: 130 },
    { left: 20, top: 150, width: 375, height: 300 },
    { width: 343, height: 600 },
  )
  assert.deepEqual(layout, { left: 36, top: 166, maxHeight: 268 })
})
