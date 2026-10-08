import type { CSSProperties } from 'react'
import type { LegendItem } from './palettes'

export type LegendPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

const INSET = 8

/** Below this map width the legend would cover too much of the map, so it goes under it instead. */
export const LEGEND_INLINE_BELOW = 520

interface Box {
  width: number
  height: number
  /** The map's <svg> relative to the wrapper the legend is positioned in. */
  inMap: { left: number; top: number }
}

/** Anchors a corner of the legend to the same corner of the map's <svg>, whatever the legend's size. */
const place = (position: LegendPosition, box: Box | null): CSSProperties => {
  const right = position.endsWith('right')
  const bottom = position.startsWith('bottom')
  if (!box) {
    return { position: 'absolute', [right ? 'right' : 'left']: INSET, [bottom ? 'bottom' : 'top']: INSET }
  }
  return {
    position: 'absolute',
    left: right ? box.inMap.left + box.width - INSET : box.inMap.left + INSET,
    top: bottom ? box.inMap.top + box.height - INSET : box.inMap.top + INSET,
    transform: `translate(${right ? '-100%' : '0'}, ${bottom ? '-100%' : '0'})`,
  }
}

interface MapLegendProps {
  title: string
  items: LegendItem[]
  position: LegendPosition
  /** The map's measured <svg> box (see useMapBox), or null before it is known. */
  box: Box | null
}

const swatch = (color: string): CSSProperties => ({
  flex: '0 0 auto',
  width: 12,
  height: 12,
  borderRadius: 2,
  border: '1px solid rgba(0, 0, 0, 0.35)',
  background: color,
})

const look: CSSProperties = {
  boxSizing: 'border-box',
  border: '1px solid var(--rwme-legend-border, #d0d7de)',
  borderRadius: 6,
  background: 'var(--rwme-legend-bg, rgba(255, 255, 255, 0.88))',
  color: 'var(--rwme-legend-text, #1f2328)',
  fontSize: '0.75rem',
  lineHeight: 1.35,
}

/**
 * What the map's colours stand for. On a map wide enough it is drawn over a corner of the map and
 * never takes clicks; on a small map it becomes a wrapping strip under the map, so it cannot hide
 * the countries.
 */
export const MapLegend = ({ title, items, position, box }: MapLegendProps) => {
  const inline = box !== null && box.width < LEGEND_INLINE_BELOW

  return (
    <div
      className={inline ? 'rwme-legend rwme-legend--inline' : 'rwme-legend'}
      style={
        inline
          ? {
              ...look,
              marginTop: 8,
              padding: '6px 10px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '4px 14px',
              width: box.width,
              marginLeft: box.inMap.left,
            }
          : {
              ...look,
              ...place(position, box),
              zIndex: 5,
              pointerEvents: 'none', // a click on the legend is a click on the map below it
              padding: '6px 10px',
            }
      }
    >
      <div style={{ marginBottom: inline ? 0 : 4, fontWeight: 600 }}>{title}</div>
      <ul
        aria-label="Map legend"
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          ...(inline && { display: 'flex', flexWrap: 'wrap', gap: '2px 14px' }),
        }}
      >
        {items.map(({ label, color }) => (
          <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span aria-hidden="true" style={swatch(color)} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}
