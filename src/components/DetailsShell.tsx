import type { CSSProperties, ReactNode } from 'react'
import { classNames } from '../lib/classNames'
import { detailsStyles } from '../styles/detailsStyles'
import type { CardAppearance } from '../types'

interface DetailsShellProps extends Pick<CardAppearance, 'fontFamily' | 'fontStyle' | 'style'> {
  /** The accessible name of the card when it is its own live region. */
  label: string
  className?: string
  /** The card's own look: the normal card, the empty hint or the warning. */
  look: CSSProperties
  /** Set when the card is the content of a dialog that already names and announces it. The card then
   * is a plain polite live area instead of a second, separately named `status` region, which would
   * make a screen reader announce the same content twice. */
  inDialog: boolean
  /** When given, a "Hide" button is shown and calls this. */
  onClose?: () => void
  children: ReactNode
}

/** The frame shared by the one-country card and the list: live region, look, fonts and "Hide". */
export const DetailsShell = ({
  label,
  className,
  look,
  fontFamily,
  fontStyle,
  style,
  inDialog,
  onClose,
  children,
}: DetailsShellProps) => (
  <div
    {...(inDialog ? { 'aria-live': 'polite' as const } : { role: 'status', 'aria-label': label })}
    className={classNames('rwme-details', className)}
    style={{
      ...look,
      ...(fontFamily && { fontFamily }),
      ...(fontStyle && { fontStyle }),
      ...style,
    }}
  >
    {onClose && (
      <button type="button" onClick={onClose} aria-label="Hide details" style={detailsStyles.close}>
        Hide
      </button>
    )}
    {children}
  </div>
)
