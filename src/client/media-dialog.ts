export type DialogViewport = {
  left: number
  top: number
  width: number
  height: number
}
export type DialogAnchor = { left: number; top: number; bottom: number }

export function mediaDialogLayout(
  anchor: DialogAnchor,
  viewport: DialogViewport,
  panel: { width: number; height: number },
): { left: number; top: number; maxHeight: number } {
  const margin = 16
  const maxHeight = Math.max(0, viewport.height - margin * 2)
  const width = Math.min(panel.width, Math.max(0, viewport.width - margin * 2))
  const height = Math.min(panel.height, maxHeight)
  const minLeft = viewport.left + margin
  const minTop = viewport.top + margin
  const maxLeft = Math.max(
    minLeft,
    viewport.left + viewport.width - width - margin,
  )
  const maxTop = Math.max(
    minTop,
    viewport.top + viewport.height - height - margin,
  )
  if (viewport.width <= 640)
    return {
      left: Math.max(minLeft, viewport.left + (viewport.width - width) / 2),
      top: Math.max(minTop, viewport.top + (viewport.height - height) / 2),
      maxHeight,
    }
  let top = anchor.bottom + 8
  const above = anchor.top - height - 8
  if (top > maxTop && above >= minTop) top = above
  return {
    left: Math.min(Math.max(anchor.left, minLeft), maxLeft),
    top: Math.min(Math.max(top, minTop), maxTop),
    maxHeight,
  }
}
