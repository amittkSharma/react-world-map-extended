import { LabelValue } from './types'

export enum MapDataOptions {
  COUNTRY_NAME = 'CountryName',
  COUNTRY_CAPITAL = 'CountryCapital',
  COUNTRY_LANGUAGE_INFO = 'CountryLanguageInfo',
  COUNTRY_CURRENCY_INFO = 'CountryCurrencyInfo',
  COUNTRY_COMPLETE_INFO = 'CountryCompleteInfo',
  COUNTRY_REGION_INFO = 'CountryRegionInfo', // IGNORE
}

export enum MapColorOptions {
  BLACK_AND_WHITE = 'BlackAndWhite',
  COLORFUL = 'Colorful',
}

export const mapDataOptions: Array<LabelValue> = [
  { label: 'Only Name', value: MapDataOptions.COUNTRY_NAME },
  { label: 'Capital', value: MapDataOptions.COUNTRY_CAPITAL },
  { label: 'Region Information', value: MapDataOptions.COUNTRY_REGION_INFO },
  { label: 'Language Information', value: MapDataOptions.COUNTRY_LANGUAGE_INFO },
  { label: 'Currency Information', value: MapDataOptions.COUNTRY_CURRENCY_INFO },
  { label: 'Complete Information', value: MapDataOptions.COUNTRY_COMPLETE_INFO },
]

export const mapColorOptions: Array<LabelValue> = [
  { label: 'Black and White', value: MapColorOptions.BLACK_AND_WHITE },
  { label: 'Colorful', value: MapColorOptions.COLORFUL },
]
