import { regions } from 'react-svg-worldmap'

/** ISO code (upper case) -> name, as the map writes it on each country (`aria-label`). */
export const countryNames = new Map(regions.map((region) => [region.code.toUpperCase(), region.name]))

/** The other way round: map name -> ISO code (upper case). */
export const countryCodes = new Map(regions.map((region) => [region.name, region.code.toUpperCase()]))
