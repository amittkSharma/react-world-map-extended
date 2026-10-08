import type { CountryDetailInformation } from 'i18n-iso-countries-extended-info'
import { getCountryDetailInformationByAlpha2Code } from 'i18n-iso-countries-extended-info'
import { MapDataOptions, type MapInfoMode } from '../constants'

/** Details of one country; `infoLink` is a URL with more information about it (Wikipedia by default). */
export type CountryDetail = Partial<CountryDetailInformation> & { infoLink?: string }

/** Resolves the `infoLink` of a country; return `undefined` for no link. */
export type InfoLinkResolver = (countryCode: string, countryName: string) => string | undefined

export const getWikipediaUrl: InfoLinkResolver = (_countryCode, countryName) =>
  `https://en.wikipedia.org/wiki/${encodeURIComponent(countryName.replace(/ /g, '_'))}`

// `infoLink` is not a data field: it is added to every result by getCountryDetail
const NAME: Array<keyof CountryDetailInformation> = ['name']
const CURRENCY: Array<keyof CountryDetailInformation> = ['currency', 'symbol', 'currencyName']

const fieldsByOption: Record<MapInfoMode, Array<keyof CountryDetailInformation>> = {
  [MapDataOptions.COUNTRY_NAME]: NAME,
  [MapDataOptions.COUNTRY_CAPITAL]: [...NAME, 'capital'],
  [MapDataOptions.COUNTRY_REGION_INFO]: [...NAME, 'region', 'continent'],
  [MapDataOptions.COUNTRY_LANGUAGE_INFO]: [...NAME, 'language'],
  [MapDataOptions.COUNTRY_CURRENCY_INFO]: [...NAME, ...CURRENCY],
  [MapDataOptions.COUNTRY_COMPLETE_INFO]: [
    ...NAME,
    'capital',
    'region',
    'continent',
    'isdCodes',
    ...CURRENCY,
    'language',
  ],
}

/**
 * Details for an ISO 3166-1 alpha-2 country code (any case): the fields of `option` plus `infoLink`
 * (from `getInfoLink`, Wikipedia by default). Returns undefined for codes the data source does not know.
 */
export const getCountryDetail = (
  countryCode: string,
  option: MapInfoMode,
  getInfoLink: InfoLinkResolver = getWikipediaUrl,
): CountryDetail | undefined => {
  let detail: CountryDetailInformation | undefined
  try {
    detail = getCountryDetailInformationByAlpha2Code(countryCode.toUpperCase())
  } catch {
    return undefined
  }
  if (!detail) return undefined

  const result: CountryDetail = {}
  for (const field of fieldsByOption[option]) {
    // biome-ignore lint/suspicious/noExplicitAny: assigning one key of a union-typed record
    ;(result as any)[field] = detail[field]
  }
  const infoLink = detail.name ? getInfoLink(countryCode.toUpperCase(), detail.name) : undefined
  if (infoLink) result.infoLink = infoLink
  return result
}
