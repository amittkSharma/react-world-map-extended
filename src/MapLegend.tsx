import type { CSSProperties } from 'react'
import type { LegendItem } from './palettes'

export type LegendPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

const INSET = 8

/** Anchors a corner of the legend to the same corner of the map's <svg>, whatever the legend's size. */
const place = (
  position: LegendPosition,
  box: { left: number; top: number; width: number; height: number } | null,
): CSSProperties => {
  const right = position.endsWith('right')
  const bottom = position.startsWith('bottom')
  if (!box)
    return {
      position: 'absolute',
      [right ? 'right' : 'left']: INSET,
      [bottom ? 'bottom' : 'top']: INSET,
    }
  return {
    position: 'absolute',
    left: right ? box.left + box.width - INSET : box.left + INSET,
    top: bottom ? box.top + box.height - INSET : box.top + INSET,
    transform: `translate(${right ? '-100%' : '0'}, ${bottom ? '-100%' : '0'})`,
  }
}

interface MapLegendProps {
  title: string
  items: LegendItem[]
  position: LegendPosition
  /** The map's measured <svg> box (see useMapBox), or null before it is known. */
  box: { left: number; top: number; width: number; height: number } | null
}

/** What the map's colours stand for, drawn over a corner of the map. It never takes clicks. */
export const MapLegend = ({ title, items, position, box }: MapLegendProps) => (
  <div
    className="rwme-legend"
    style={{
      ...place(position, box),
      zIndex: 5,
      pointerEvents: 'none', // a click on the legend is a click on the map below it
      boxSizing: 'border-box',
      padding: '6px 10px',
      border: '1px solid var(--rwme-legend-border, #d0d7de)',
      borderRadius: 6,
      background: 'var(--rwme-legend-bg, rgba(255, 255, 255, 0.88))',
      color: 'var(--rwme-legend-text, #1f2328)',
      fontSize: '0.75rem',
      lineHeight: 1.35,
    }}
  >
    <div style={{ marginBottom: 4, fontWeight: 600 }}>{title}</div>
    <ul aria-label="Map legend" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {items.map(({ label, color }) => (
        <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            aria-hidden="true"
            style={{
              flex: '0 0 auto',
              width: 12,
              height: 12,
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.35)',
              background: color,
            }}
          />
          {label}
        </li>
      ))}
    </ul>
  </div>
)
