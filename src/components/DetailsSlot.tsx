import type { CSSProperties, ReactNode } from 'react'
import type { CardAppearance } from '../types'
import { ShowDetailsButton } from './ShowDetailsButton'

interface DetailsSlotProps extends Pick<CardAppearance, 'fontFamily' | 'fontStyle'> {
  /** Whether the card is open (shown). */
  open: boolean
  hasSelection: boolean
  /** What the "Show details" button says the card is about. */
  hiddenLabel: string
  onShow: () => void
  style: CSSProperties
  /** The open card. */
  children: ReactNode
}

/**
 * Where the card sits next to the map: the card while it is open, or the button that brings it back
 * while it is hidden and something is selected.
 */
export const DetailsSlot = ({
  open,
  hasSelection,
  hiddenLabel,
  onShow,
  style,
  fontFamily,
  fontStyle,
  children,
}: DetailsSlotProps) => {
  if (open) {
    return (
      <div data-rwme-keep style={style}>
        {children}
      </div>
    )
  }
  if (!hasSelection) return null
  return (
    <div data-rwme-keep style={style}>
      <ShowDetailsButton
        name={hiddenLabel}
        onClick={onShow}
        fontFamily={fontFamily}
        fontStyle={fontStyle}
      />
    </div>
  )
}
