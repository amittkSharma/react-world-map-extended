import { registerLocale } from 'i18n-iso-countries'
import { getCountryDetailInformationByName } from 'i18n-iso-countries-extended-info'
import enLocale from 'i18n-iso-countries/langs/en.json'
import { Data } from 'react-svg-worldmap'
import { MapDataOptions } from 'src/constants'
import { defaultMapData } from './defaultMapData'

registerLocale(enLocale)

interface CountryDetail {
  name?: string
  capital?: string
  region?: string
  isdCodes?: Array<number>
  currency?: string
  symbol?: string
  currencyName?: string
  language?: {
    code?: string
    official?: string
    others?: Array<string>
  }
  continent?: string
}

export const defaultData: Data<string> = defaultMapData

export const getCountryDetail = (
  countryName: string,
  dataOptions: MapDataOptions,
): CountryDetail => {
  try {
    const countryDetail = getCountryDetailInformationByName(countryName)

    switch (dataOptions) {
      case MapDataOptions.COUNTRY_NAME:
        return { name: countryDetail?.name }
      case MapDataOptions.COUNTRY_CAPITAL:
        return { name: countryDetail?.name, capital: countryDetail?.capital }
      case MapDataOptions.COUNTRY_REGION_INFO: {
        return {
          name: countryDetail?.name,
          region: countryDetail?.region,
          continent: countryDetail?.continent,
        }
      }
      case MapDataOptions.COUNTRY_CURRENCY_INFO:
        return {
          name: countryDetail?.name,
          currency: countryDetail?.currency,
          symbol: countryDetail?.symbol,
          currencyName: countryDetail?.currencyName,
        }
      case MapDataOptions.COUNTRY_LANGUAGE_INFO:
        return {
          name: countryDetail?.name,
          language: {
            ...countryDetail?.language,
          },
        }
      case MapDataOptions.COUNTRY_COMPLETE_INFO:
        return {
          name: countryDetail?.name,
          capital: countryDetail?.capital,
          region: countryDetail?.region,
          isdCodes: countryDetail?.isdCodes,
        }
      default:
        return { name: countryDetail?.name }
    }
  } catch (e) {
    console.error(`error occurred:${JSON.stringify((e as Error).message)}`)
    return undefined
  }
}
