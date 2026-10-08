import type { CSSProperties } from 'react'
import type { MapBox } from '../hooks/useMapBox'

/** Where the details card sits relative to the map. `overlay` covers the map and blocks it until closed. */
export type DetailsPosition = 'bottom' | 'top' | 'left' | 'right' | 'overlay'

/** The width of a card beside the map; themeable with `--rwme-panel-width`. */
const SIDE_CARD_WIDTH = 'var(--rwme-panel-width, 20rem)'

/** A side card needs room: on a narrow component it moves above / below the map instead. */
export const resolvePosition = (
  requested: DetailsPosition,
  layoutWidth: number | undefined,
  stackBelow: number,
): DetailsPosition => {
  if (layoutWidth === undefined || layoutWidth >= stackBelow) return requested
  if (requested === 'left') return 'top'
  if (requested === 'right') return 'bottom'
  return requested
}

/**
 * The slot of the card, lined up with the map's real <svg>: as wide as the map and flush with its left
 * edge above / below it; as tall as the map and flush with its top edge beside it.
 */
export const slotStyle = (sideways: boolean, box: MapBox | null): CSSProperties =>
  sideways
    ? {
        flex: `0 0 ${SIDE_CARD_WIDTH}`,
        width: SIDE_CARD_WIDTH,
        marginTop: box?.top,
        height: box?.height,
      }
    : { width: box?.width ?? '100%', marginLeft: box?.left }
