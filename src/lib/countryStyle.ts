import type { CSSProperties } from 'react'
import type { CountryContext } from 'react-svg-worldmap'
import {
  baseStyle,
  DEFAULT_DIMMED_OPACITY,
  dimmedStyle,
  focusOnSelectedStyle,
  focusStyle,
  linkedStyle,
  noDataStyle,
  selectedStyle,
  WHITE,
} from '../styles/mapStyles'
import { scaleColor } from './colorScale'
import type { ValidatedProperty } from './countryData'
import { type CountryColors, getPaletteColors, type MapPalette } from './palettes'

export type ColorsOption = CountryColors | ((context: CountryContext<string>) => string | undefined)

export type StyleOverrides =
  | CSSProperties
  | ((
      context: CountryContext<string>,
      state: { selected: boolean; dimmed: boolean },
    ) => CSSProperties)

/** The opacity of the countries that are not selected: `true` is the default, a number is clamped to 0–1, `false` is no fading. */
export const dimmedOpacityFor = (dimOthers: boolean | number): number | undefined => {
  if (dimOthers === false) return undefined
  return dimOthers === true ? DEFAULT_DIMMED_OPACITY : Math.min(1, Math.max(0, dimOthers))
}

interface CountryStyleOptions {
  colorful: boolean
  palette: MapPalette
  colors: ColorsOption | undefined
  /** The property of your own data that colours the map, and the numbers by country code. */
  property: ValidatedProperty | undefined
  numberFor: (code: string) => number | undefined
  /** Paint countries without a number grey (only with your own data). */
  greyOutCountriesWithoutData: boolean
  selectedCodes: readonly string[]
  highlightSelected: boolean
  /** The opacity of the countries that are not selected; `undefined` for no fading. */
  dimmedOpacity: number | undefined
  /** The country with keyboard focus, and the one whose list entry is pointed at. */
  focusedCode: string | null
  linkedCode: string | null
  styleOverrides: StyleOverrides | undefined
}

/** Builds the function that styles each country of the map. */
export const createCountryStyle = (options: CountryStyleOptions) => {
  const { colorful, property, numberFor, selectedCodes, focusedCode, linkedCode } = options
  const paletteColors = getPaletteColors(options.palette)
  const spotlight =
    options.highlightSelected && selectedCodes.length > 0 && options.dimmedOpacity !== undefined

  const fillOf = (context: CountryContext<string>, code: string) => {
    const value = numberFor(code)
    if (property && value !== undefined) return scaleColor(property, value)
    const custom =
      typeof options.colors === 'function'
        ? options.colors(context)
        : options.colors?.[code as keyof CountryColors]
    return custom ?? paletteColors[code as keyof CountryColors] ?? WHITE
  }

  return (context: CountryContext<string>): CSSProperties => {
    const code = context.countryCode.toUpperCase()
    const selected = options.highlightSelected && selectedCodes.includes(code)
    const dimmed = spotlight && !selected
    const hasNoData = Boolean(property) && numberFor(code) === undefined
    const computed: CSSProperties = {
      ...baseStyle,
      ...(colorful && { fill: fillOf(context, code) }),
      ...(options.greyOutCountriesWithoutData && hasNoData && noDataStyle),
      ...(selected && selectedStyle),
      ...(dimmed && options.dimmedOpacity !== undefined && dimmedStyle(options.dimmedOpacity)),
      ...(focusedCode === code && (selected ? focusOnSelectedStyle : focusStyle)),
      ...(linkedCode === code && linkedStyle),
    }
    const { styleOverrides } = options
    const overrides =
      typeof styleOverrides === 'function'
        ? styleOverrides(context, { selected, dimmed })
        : styleOverrides
    return { ...computed, ...overrides }
  }
}
