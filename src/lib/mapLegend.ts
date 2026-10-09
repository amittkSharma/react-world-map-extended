import { NO_DATA_FILL } from '../styles/mapStyles'
import { formatNumber, shade } from './colorScale'
import type { ValidatedProperty } from './countryData'
import { getPaletteLegend, type LegendItem, type MapPalette } from './palettes'
import { classCount } from './scale'

/** A colour scale from light to dark, with the numbers at its two ends. */
interface LegendGradient {
  from: string
  to: string
  min: string
  max: string
}

export interface MapLegendContent {
  title: string
  /** One line under the title, e.g. how the scale works. */
  note?: string
  items?: LegendItem[]
  gradient?: LegendGradient
}

/** The classes of a quantile scale: a shade and the range of numbers of each. */
const classItems = ({ color, min, max, breaks, clampedLow, clampedHigh }: ValidatedProperty) => {
  const classes = classCount({ breaks })
  const bounds = [min, ...breaks, max].map(formatNumber)
  return Array.from({ length: classes }, (_, index): LegendItem => {
    const first = index === 0 && clampedLow && classes > 1
    const last = index === classes - 1 && clampedHigh && classes > 1
    return {
      label: first
        ? `≤ ${bounds[1]}`
        : last
          ? `≥ ${bounds[index]}`
          : `${bounds[index]} – ${bounds[index + 1]}`,
      color: shade(color, classes === 1 ? 0.5 : index / (classes - 1)),
    }
  })
}

/** The legend of the property that colours the map. */
const propertyLegend = (property: ValidatedProperty, greyOut: boolean): MapLegendContent => {
  const { name, color, kind, min, max, clampedLow, clampedHigh } = property
  const noData = greyOut ? [{ label: 'No data', color: NO_DATA_FILL }] : []
  if (kind === 'quantile') {
    return {
      title: name,
      note: 'Classes with equal numbers of countries',
      items: [...classItems(property), ...noData],
    }
  }
  return {
    title: name,
    note: kind === 'log' ? 'Logarithmic scale' : undefined,
    gradient: {
      from: shade(color, 0),
      to: shade(color, 1),
      min: `${clampedLow ? '≤ ' : ''}${formatNumber(min)}`,
      max: `${clampedHigh ? '≥ ' : ''}${formatNumber(max)}`,
    },
    items: noData,
  }
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
  if (activeProperty) return propertyLegend(activeProperty, greyOutCountriesWithoutData)
  return hasCustomColors ? undefined : getPaletteLegend(palette)
}
