import { detailsStyles } from '../styles/detailsStyles'
import type { CardAppearance } from '../types'

interface ShowDetailsButtonProps extends Pick<CardAppearance, 'fontFamily' | 'fontStyle'> {
  /** What the hidden card is about: a country, or "n countries". */
  name: string
  onClick: () => void
}

/** Compact button that brings a hidden details card back. */
export const ShowDetailsButton = ({
  name,
  onClick,
  fontFamily,
  fontStyle,
}: ShowDetailsButtonProps) => (
  <button
    type="button"
    className="rwme-details-toggle"
    aria-expanded={false}
    onClick={onClick}
    style={{
      ...detailsStyles.close,
      position: 'static',
      alignSelf: 'flex-start',
      padding: '0.35rem 0.8rem',
      fontSize: '0.9rem',
      ...(fontFamily && { fontFamily }),
      ...(fontStyle && { fontStyle }),
    }}
  >
    Show details: {name}
  </button>
)
