import { formatNumber } from './colorScale'
import type { CountryDataValue } from './countryData'
import type { CountryDetail } from './countryDetail'
import { continentNames } from './palettes'

/** A built-in fact of a country (`infoLink` is the link, not a fact). */
export type Field = Exclude<keyof CountryDetail, 'infoLink'>

export const labels: Partial<Record<Field, string>> = {
  capital: 'Capital',
  region: 'Region',
  continent: 'Continent',
  currency: 'Code',
  symbol: 'Symbol',
  currencyName: 'Name',
  language: 'Official language',
  isdCodes: 'Dialling prefix',
}

export const formatValue = (field: Field, value: NonNullable<CountryDetail[Field]>): string => {
  if (field === 'continent' && typeof value === 'string') return continentNames[value] ?? value
  if (Array.isArray(value)) {
    return value.map((item) => (field === 'isdCodes' ? `+${item}` : item)).join(', ')
  }
  if (typeof value === 'object') {
    const { official, code } = value
    return [official, code && `(${code})`].filter(Boolean).join(' ')
  }
  return String(value)
}

/** Your own value as text: numbers are grouped like in the legend (`83 000 000` is easier to read than `83000000`). */
export const displayValue = (value: CountryDataValue) =>
  value === null ? '—' : typeof value === 'number' ? formatNumber(value) : String(value)
