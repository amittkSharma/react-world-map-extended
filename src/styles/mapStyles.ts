import type { CSSProperties } from 'react'

export const WHITE = '#ffffff'
export const DEFAULT_DIMMED_OPACITY = 0.35

/** The fill of a country without data (themeable: `--rwme-no-data-fill`). */
export const NO_DATA_FILL = 'var(--rwme-no-data-fill, #e5e7eb)'

// For text that only screen readers should get
export const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

// Every colour can be themed from outside with CSS custom properties, e.g.
// `<ExtendedWorldMap style={{ '--rwme-stroke': '#336' }} />`.
export const baseStyle: CSSProperties = {
  fill: `var(--rwme-fill, ${WHITE})`,
  fillOpacity: 1,
  stroke: 'var(--rwme-stroke, #000000)',
  strokeWidth: 'var(--rwme-stroke-width, 1.2)',
  strokeOpacity: 0.7,
  cursor: 'pointer',
  // the browser's focus ring is a box around the whole path; keyboard focus is drawn by `focusStyle`
  outline: 'none',
}

export const noDataStyle: CSSProperties = { fill: NO_DATA_FILL, fillOpacity: 1 }

export const selectedStyle: CSSProperties = {
  stroke: 'var(--rwme-selected-stroke, #d62828)',
  strokeWidth: 'var(--rwme-selected-stroke-width, 2.5)',
  strokeOpacity: 1,
}

/** The countries that are not selected while others are. */
export const dimmedStyle = (opacity: number): CSSProperties => ({
  fillOpacity: `var(--rwme-dimmed-opacity, ${opacity})`,
  strokeOpacity: `calc(var(--rwme-dimmed-opacity, ${opacity}) * 0.7)`,
})

// Keyboard focus follows the country's shape, unlike the browser's focus ring. react-svg-worldmap
// restyles a focused country's border width and opacity (as it does on hover) over whatever is set
// here, so the ring is mostly a glow, which that restyling leaves alone.
const FOCUS_GLOW =
  'drop-shadow(0 0 2px var(--rwme-focus-stroke, #1a73e8)) drop-shadow(0 0 1px var(--rwme-focus-stroke, #1a73e8))'

export const focusStyle: CSSProperties = {
  stroke: 'var(--rwme-focus-stroke, #1a73e8)',
  strokeWidth: 'var(--rwme-focus-stroke-width, 3)',
  strokeOpacity: 1,
  filter: FOCUS_GLOW,
}

// Focus on the selected country: its red outline stays (it marks the selection), dashed so that the
// focus is visible too
export const focusOnSelectedStyle: CSSProperties = { strokeDasharray: '6 3', filter: FOCUS_GLOW }

// The country whose entry in the details list is being pointed at (or the reverse)
export const linkedStyle: CSSProperties = {
  strokeOpacity: 1,
  filter: 'drop-shadow(0 0 4px var(--rwme-linked-glow, #f59e0b))',
}

// The overlay card IS the dimmed layer: it covers the map exactly, translucent so the map shows through
export const overlayCardStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  overflow: 'auto',
  padding: '1.5rem',
  borderStyle: 'none',
  borderRadius: 0,
  background: 'var(--rwme-overlay-bg, rgba(255, 255, 255, 0.82))',
  backdropFilter: 'blur(3px)',
}
