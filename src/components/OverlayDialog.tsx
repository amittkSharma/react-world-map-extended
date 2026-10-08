import type { ReactNode, RefObject } from 'react'
import type { MapBox } from '../hooks/useMapBox'

interface OverlayDialogProps {
  dialogRef: RefObject<HTMLDivElement | null>
  /** The map's measured box: the dialog covers it exactly. */
  box: MapBox | null
  label: string
  children: ReactNode
}

/** A modal dialog that covers the map exactly; its children are the card. */
export const OverlayDialog = ({ dialogRef, box, label, children }: OverlayDialogProps) => (
  <div
    className="rwme-overlay"
    style={{
      position: 'absolute',
      zIndex: 10,
      ...(box
        ? { left: box.inMap.left, top: box.inMap.top, width: box.width, height: box.height }
        : { inset: 0 }),
    }}
  >
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      style={{ width: '100%', height: '100%', outline: 'none' }}
    >
      {children}
    </div>
  </div>
)
