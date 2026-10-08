import type { CSSProperties } from 'react'
import { type Corner, type CornerBox, placeInCorner } from '../lib/corner'
import type { MapLegendContent } from '../lib/mapLegend'

export type LegendPosition = Corner

/** Below this map width the legend would cover too much of the map, so it goes under it instead. */
const LEGEND_INLINE_BELOW = 520

interface MapLegendProps extends MapLegendContent {
  position: LegendPosition
  /** The map's measured <svg> box (see useMapBox), or null before it is known. */
  box: CornerBox | null
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
export const MapLegend = ({ title, items = [], gradient, position, box }: MapLegendProps) => {
  const inline = box !== null && box.width < LEGEND_INLINE_BELOW

  return (
    <div
      data-rwme-keep // the strip under a small map takes clicks; they are not clicks away from the selection
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
              ...placeInCorner(position, box),
              zIndex: 5,
              pointerEvents: 'none', // a click on the legend is a click on the map below it
              padding: '6px 10px',
            }
      }
    >
      <div style={{ marginBottom: inline ? 0 : 4, fontWeight: 600 }}>{title}</div>
      {gradient && (
        <div
          role="img"
          aria-label={`${title}: from ${gradient.min} to ${gradient.max}, light to dark`}
          style={{ minWidth: 140, marginBottom: inline || items.length === 0 ? 0 : 6 }}
        >
          <div
            aria-hidden="true"
            style={{
              height: 10,
              borderRadius: 2,
              border: '1px solid rgba(0, 0, 0, 0.35)',
              background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`,
            }}
          />
          <div
            aria-hidden="true"
            style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 2 }}
          >
            <span>{gradient.min}</span>
            <span>{gradient.max}</span>
          </div>
        </div>
      )}
      {items.length > 0 && (
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
      )}
    </div>
  )
}
