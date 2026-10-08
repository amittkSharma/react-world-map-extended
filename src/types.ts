import type { CSSProperties } from 'react'

export interface LabelValue<T extends string = string> {
  label: string
  value: T
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

/** How a details card looks. Shared by the card, the list and `detailsOptions`. */
export interface CardAppearance {
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
