import type { CSSProperties } from 'react'

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export const CORNER_INSET = 8

export interface CornerBox {
  width: number
  height: number
  /** The map's <svg> relative to the wrapper the element is positioned in. */
  inMap: { left: number; top: number }
}

/**
 * Anchors a corner of an element to the same corner of the map's <svg>, whatever the element's size.
 * Before the map has been measured it sits in the same corner of the wrapper instead.
 */
export const placeInCorner = (corner: Corner, box: CornerBox | null): CSSProperties => {
  const right = corner.endsWith('right')
  const bottom = corner.startsWith('bottom')
  // max-content: an element anchored near the right edge by its `left` would otherwise be squeezed
  // into the little room left of that point and wrap every word
  if (!box) {
    return {
      position: 'absolute',
      width: 'max-content',
      [right ? 'right' : 'left']: CORNER_INSET,
      [bottom ? 'bottom' : 'top']: CORNER_INSET,
    }
  }
  return {
    position: 'absolute',
    width: 'max-content',
    left: right ? box.inMap.left + box.width - CORNER_INSET : box.inMap.left + CORNER_INSET,
    top: bottom ? box.inMap.top + box.height - CORNER_INSET : box.inMap.top + CORNER_INSET,
    transform: `translate(${right ? '-100%' : '0'}, ${bottom ? '-100%' : '0'})`,
  }
}
