import { registerLocale } from 'i18n-iso-countries'
import { getCountryDetailInformationByName } from 'i18n-iso-countries-extended-info'
import enLocale from 'i18n-iso-countries/langs/en.json'
import { Data } from 'react-svg-worldmap'
import { defaultMapData } from './defaultMapData'

registerLocale(enLocale)

export const defaultData: Data<string> = defaultMapData

export const getDefaultCountryColor = (countryCode: string) => {
  const filteredData = defaultData.find((data) => data.country === countryCode)
  return filteredData ? JSON.parse(filteredData.value).color || '#F4A261' : '#F4A261'
}

export const getCountryDetail = (countryName: string) => {
  try {
    return getCountryDetailInformationByName(countryName)
  } catch (e) {
    console.error(`error occured:${JSON.stringify((e as Error).message)}`)
    return undefined
  }
}
