import { MapDataOptions, type MapInfoMode } from '../constants'
import { countryNames } from './countries'
import type { CountryDataValues } from './countryData'
import { type CountryDetail, getCountryDetail, type InfoLinkResolver } from './countryDetail'

/** Which facts a card shows: the built-in ones, your own (`countryData`), or both. */
export type DetailsSource = 'default' | 'custom' | 'both'

/** One country as a card shows it. */
export interface SelectionContent {
  name: string
  /** The built-in facts; `undefined` for areas without data (Northern Cyprus, Somaliland). */
  detail: CountryDetail | undefined
  /** Your own values for this country, if you gave any. */
  custom?: CountryDataValues | null
  /** Default `'default'`. */
  source?: DetailsSource
}

export interface CountrySelection extends SelectionContent {
  /** ISO 3166-1 alpha-2 code, upper case. */
  code: string
}

/** What `onCountryClick` gets: the built-in facts, or your own values (or both merged, yours win). */
export type CountryClickInfo = CountryDetail | CountryDataValues

/** Whether there is anything to show for the country with the chosen source. */
export const hasContent = ({ detail, custom, source = 'default' }: SelectionContent) => {
  if (source === 'custom') return Boolean(custom)
  if (source === 'both') return Boolean(custom || detail)
  return Boolean(detail)
}

export const missingMessage = ({ name, source = 'default' }: SelectionContent) =>
  source === 'default' ? `No details available for ${name}.` : `No data for ${name}.`

const isWebAddress = (value: unknown): value is string =>
  typeof value === 'string' && /^https?:\/\//i.test(value.trim())

interface SourceOptions {
  source: DetailsSource
  /** Your own rows by country code, when there are any. */
  rows: ReadonlyMap<string, CountryDataValues> | undefined
  infoMode: MapInfoMode
  getInfoLink: InfoLinkResolver | undefined
}

/** Your values for a country, the property that colours the map first. */
const ownValues = (own: CountryDataValues | undefined, firstProperty: string | undefined) =>
  own && firstProperty !== undefined && Object.keys(own).includes(firstProperty)
    ? { [firstProperty]: own[firstProperty], ...own }
    : (own ?? null)

/** What each selected country shows in a card. */
export const buildSelections = (
  codes: readonly string[],
  {
    source,
    rows,
    infoMode,
    getInfoLink,
    firstProperty,
  }: SourceOptions & { firstProperty?: string },
): CountrySelection[] =>
  codes.map((code) => {
    const custom = ownValues(rows?.get(code), firstProperty)
    // with only your data the built-in facts are just the name and the link
    const detail = getCountryDetail(
      code,
      source === 'custom' ? MapDataOptions.COUNTRY_NAME : infoMode,
      getInfoLink,
    )
    const ownLink = custom?.infoLink
    return {
      code,
      name: countryNames.get(code) ?? code,
      // a link of your own wins over the default one, if it is a web address
      detail: detail && isWebAddress(ownLink) ? { ...detail, infoLink: ownLink } : detail,
      custom,
      source,
    }
  })

/** What `onCountryClick` reports for a country. */
export const clickInfo = (
  code: string,
  { source, rows, infoMode, getInfoLink }: SourceOptions,
): CountryClickInfo | undefined => {
  const facts = getCountryDetail(code, infoMode, getInfoLink)
  const own = rows?.get(code)
  if (source === 'custom') return own
  if (source === 'both') return facts || own ? { ...facts, ...own } : undefined
  return facts
}
