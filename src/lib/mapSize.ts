import type { SizeOption } from 'react-svg-worldmap'

export type MapSize = SizeOption | 'responsive' | number

// The widths react-svg-worldmap gives its size presets (the map is never wider). Mirrored here only
// to keep a side card next to the map; if the library changes them, the map still fits.
const presetWidths: Record<SizeOption, number> = { sm: 240, md: 336, lg: 480, xl: 640, xxl: 1200 }

/** The widest the map can be, or undefined when it depends on the window (`'responsive'`). */
export const getMapMaxWidth = (size: MapSize) =>
  typeof size === 'number' ? size : size === 'responsive' ? undefined : presetWidths[size]
