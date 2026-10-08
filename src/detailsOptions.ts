import type { CSSProperties } from 'react'
import type { HeadingLevel } from './CountryDetails'

/** Where the details card sits relative to the map. `overlay` covers the map and blocks it until closed. */
export type DetailsPosition = 'bottom' | 'top' | 'left' | 'right' | 'overlay'

export interface DetailsOptions {
  /** Default `'bottom'`. With `'overlay'` the map cannot be clicked while the card is open; in every
   * other position other countries stay clickable and update the card. */
  position?: DetailsPosition
  /** Component width, in px, below which `'left'` and `'right'` fall back to `'top'` and `'bottom'`
   * (a side card needs room; on a narrow screen it would squeeze the map). Default `720`. */
  stackBelow?: number
  /** Whether the card is shown. Controlled when set; otherwise starts at `defaultOpen` (default `true`).
   * The card has a "Hide" button; a "Show details" button brings it back, and clicking a country reopens it. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Level of the country-name heading (`h1`–`h6`); category headings use the next level. Default 3. */
  headingLevel?: HeadingLevel
  /** CSS `font-family` of the card and its buttons. Default: inherited from the host page. */
  fontFamily?: string
  /** CSS `font-style` of the card and its buttons. Default: inherited from the host page. */
  fontStyle?: CSSProperties['fontStyle']
  className?: string
  /** Merged over the card's own style, last. */
  style?: CSSProperties
}
