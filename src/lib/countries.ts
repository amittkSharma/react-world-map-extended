import { regions } from 'react-svg-worldmap'
import { defaultMapData } from '../data/defaultMapData'

/** ISO code (upper case) -> name, as the map writes it on each country (`aria-label`). */
export const countryNames = new Map(
  regions.map((region) => [region.code.toUpperCase(), region.name]),
)

/** The other way round: map name -> ISO code (upper case). */
export const countryCodes = new Map(
  regions.map((region) => [region.name, region.code.toUpperCase()]),
)

/** The map names that get the library's styled tooltip: every area that has an entry in the map data. */
export const styledTooltipNames: ReadonlySet<string> = new Set(
  defaultMapData.flatMap(({ country }) => countryNames.get(country.toUpperCase()) ?? []),
)
