import { type CSSProperties, useEffect, useState } from 'react'
import { type CornerBox, placeInCorner } from '../lib/corner'

/** How long a message stays; it stays while the pointer or keyboard focus is on it. */
const TOAST_MS = 6000

interface MapToastProps {
  text: string
  box: CornerBox | null
  onDismiss: () => void
}

const toastStyle: CSSProperties = {
  zIndex: 20, // above the legend and the overlay card
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.5rem',
  padding: '0.45rem 0.6rem 0.45rem 0.75rem',
  border: '1px solid var(--rwme-panel-warning, #bf8700)',
  borderLeftWidth: 4,
  borderRadius: 6,
  background: 'var(--rwme-panel-warning-bg, #fff8c5)',
  color: 'var(--rwme-panel-text, #1f2328)',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.18)',
  fontSize: '0.8rem',
  lineHeight: 1.35,
}

/**
 * A small message over the top-right corner of the map. It is a polite status region (not an
 * alert: nothing is wrong, a limit was reached), closes itself after a while, and can be dismissed.
 * Render it with a new `key` per message so every message gets its full time.
 */
export const MapToast = ({ text, box, onDismiss }: MapToastProps) => {
  const [held, setHeld] = useState(false)

  useEffect(() => {
    if (held) return
    const timer = setTimeout(onDismiss, TOAST_MS)
    return () => clearTimeout(timer)
  }, [held, onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      data-rwme-keep // dismissing it is not a click away from the selection
      className="rwme-toast"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
      style={{
        ...placeInCorner('top-right', box),
        ...toastStyle,
        maxWidth: box ? `min(22rem, ${Math.round(box.width * 0.8)}px)` : 'min(22rem, 80%)',
      }}
    >
      <span>{text}</span>
      <button
        type="button"
        aria-label="Dismiss message"
        onClick={onDismiss}
        style={{
          flex: '0 0 auto',
          border: 'none',
          background: 'transparent',
          color: 'inherit',
          font: 'inherit',
          fontSize: '1rem',
          lineHeight: 1,
          cursor: 'pointer',
          padding: '0 0.15rem',
        }}
      >
        ×
      </button>
    </div>
  )
}
