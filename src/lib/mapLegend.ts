import { NO_DATA_FILL } from '../styles/mapStyles'
import { formatNumber, shade } from './colorScale'
import type { ValidatedProperty } from './countryData'
import { getPaletteLegend, type LegendItem, type MapPalette } from './palettes'

/** A colour scale from light to dark, with the numbers at its two ends. */
interface LegendGradient {
  from: string
  to: string
  min: string
  max: string
}

export interface MapLegendContent {
  title: string
  items?: LegendItem[]
  gradient?: LegendGradient
}

interface LegendOptions {
  showLegend: boolean
  colorful: boolean
  /** Custom colours: the built-in legend would explain colours that are not shown. */
  hasCustomColors: boolean
  palette: MapPalette
  /** The property of your own data that colours the map, if any. */
  activeProperty: ValidatedProperty | undefined
  greyOutCountriesWithoutData: boolean
}

/**
 * What the legend says. With your own data it is the colour scale of the chosen property; otherwise
 * it is the built-in palette's legend, for the palettes that have one. Nothing without colour.
 */
export const buildMapLegend = ({
  showLegend,
  colorful,
  hasCustomColors,
  palette,
  activeProperty,
  greyOutCountriesWithoutData,
}: LegendOptions): MapLegendContent | undefined => {
  if (!showLegend || !colorful) return undefined
  if (activeProperty) {
    const { name, color, min, max } = activeProperty
    return {
      title: name,
      gradient: {
        from: shade(color, 0),
        to: shade(color, 1),
        min: formatNumber(min),
        max: formatNumber(max),
      },
      items: greyOutCountriesWithoutData ? [{ label: 'No data', color: NO_DATA_FILL }] : [],
    }
  }
  return hasCustomColors ? undefined : getPaletteLegend(palette)
}
