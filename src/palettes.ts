import { MapDataOptions } from './constants'
import { countryColors } from './rawData/defaultMapData'
import { getCountryDetail } from './rawData/getDefaultMapData'

/** Fill colour per ISO 3166-1 alpha-2 code (upper case). */
export type CountryColors = Partial<Record<keyof typeof countryColors, string>>

/**
 * Colour schemes for 'Colorful' mode:
 * - `default`: a distinct colour per country
 * - `continent` / `region`: one colour per continent / region (as reported by the info data source)
 * - `monochrome`: a single colour for every country
 */
export type MapPalette = 'default' | 'continent' | 'region' | 'monochrome'

const continentColors: Record<string, string> = {
  AF: '#E69F00',
  AS: '#D55E00',
  EU: '#0072B2',
  NA: '#009E73',
  SA: '#CC79A7',
  OC: '#56B4E9',
}

const regionColors: Record<string, string> = {
  'Arab States': '#E15759',
  Africa: '#F28E2B',
  'Asia & Pacific': '#59A14F',
  Europe: '#4E79A7',
  Asia: '#76B7B2',
  Caribbean: '#EDC948',
  'South/Latin America': '#B07AA1',
  'North America': '#FF9DA7',
  'South Atlantic Ocean': '#9C755F',
}

const MONOCHROME = '#6BAED6'

const buildBy = (field: 'continent' | 'region', colors: Record<string, string>): CountryColors => {
  const result: CountryColors = {}
  for (const code of Object.keys(countryColors) as Array<keyof CountryColors>) {
    const group = getCountryDetail(code, MapDataOptions.COUNTRY_REGION_INFO)?.[field]
    const color = group ? colors[group] : undefined
    if (color) result[code] = color
  }
  return result
}

const builders: Record<MapPalette, () => CountryColors> = {
  default: () => countryColors,
  continent: () => buildBy('continent', continentColors),
  region: () => buildBy('region', regionColors),
  monochrome: () =>
    Object.fromEntries(Object.keys(countryColors).map((code) => [code, MONOCHROME])),
}

const cache = new Map<MapPalette, CountryColors>()

export const getPaletteColors = (palette: MapPalette): CountryColors => {
  let colors = cache.get(palette)
  if (!colors) {
    colors = builders[palette]()
    cache.set(palette, colors)
  }
  return colors
}

export interface LegendItem {
  label: string
  color: string
}

const continentNames: Record<string, string> = {
  AF: 'Africa',
  AS: 'Asia',
  EU: 'Europe',
  NA: 'North America',
  SA: 'South America',
  OC: 'Oceania',
}

/** What the colours of a palette stand for; `undefined` when they mean nothing in particular. */
export const getPaletteLegend = (
  palette: MapPalette,
): { title: string; items: LegendItem[] } | undefined => {
  const items = (colors: Record<string, string>, names: Record<string, string> = {}) =>
    Object.entries(colors).map(([key, color]) => ({ label: names[key] ?? key, color }))

  if (palette === 'continent') {
    return { title: 'Continents', items: items(continentColors, continentNames) }
  }
  if (palette === 'region') return { title: 'Regions', items: items(regionColors) }
  return undefined // 'default' colours every country differently, 'monochrome' uses one colour
}
