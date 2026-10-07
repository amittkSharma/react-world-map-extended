import { getCountryDetailInformationByAlpha2Code } from 'i18n-iso-countries-extended-info'
import type { CountryDetailInformation } from 'i18n-iso-countries-extended-info'
import { MapDataOptions } from '../constants'

export type CountryDetail = Partial<CountryDetailInformation>

const NAME: Array<keyof CountryDetail> = ['name']
const CURRENCY: Array<keyof CountryDetail> = ['currency', 'symbol', 'currencyName']

const fieldsByOption: Record<MapDataOptions, Array<keyof CountryDetail>> = {
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
 * Details for an ISO 3166-1 alpha-2 country code (any case), limited to the fields of `option`.
 * Returns undefined for codes the data source does not know.
 */
export const getCountryDetail = (
  countryCode: string,
  option: MapDataOptions,
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
  return result
}
