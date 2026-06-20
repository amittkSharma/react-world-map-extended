import { Data } from 'react-svg-worldmap'
import { defaultMapData } from './defaultMapData'

export const defaultData: Data<string> = defaultMapData

export const getDefaultCountryColor = (countryCode: string) => {
  const filteredData = defaultData.find((data) => data.country === countryCode)
  return filteredData ? JSON.parse(filteredData.value).color || '#F4A261' : '#F4A261'
}
