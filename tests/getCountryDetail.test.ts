import { regions } from 'react-svg-worldmap'
import { describe, expect, it } from 'vitest'
import { MapDataOptions } from '../src/constants'
import { countryColors } from '../src/rawData/defaultMapData'
import { getCountryDetail } from '../src/rawData/getDefaultMapData'

// The map also draws Northern Cyprus and Somaliland under non-ISO codes (CYP, SOM); they are
// intentionally left out here (no details, no colour).
const isoCodes = regions.map((region) => region.code).filter((code) => code.length === 2)

describe('getCountryDetail', () => {
  it.each([
    [MapDataOptions.COUNTRY_NAME, ['name']],
    [MapDataOptions.COUNTRY_CAPITAL, ['name', 'capital']],
    [MapDataOptions.COUNTRY_REGION_INFO, ['name', 'region', 'continent']],
    [MapDataOptions.COUNTRY_LANGUAGE_INFO, ['name', 'language']],
    [MapDataOptions.COUNTRY_CURRENCY_INFO, ['name', 'currency', 'symbol', 'currencyName']],
    [
      MapDataOptions.COUNTRY_COMPLETE_INFO,
      ['name', 'capital', 'region', 'continent', 'isdCodes', 'currency', 'symbol', 'currencyName', 'language'],
    ],
  ])('%s returns exactly its fields', (option, fields) => {
    const detail = getCountryDetail('FR', option)
    expect(Object.keys(detail ?? {}).sort()).toEqual([...fields].sort())
    expect(detail?.name).toBe('France')
  })

  it('returns the expected values for France', () => {
    expect(getCountryDetail('FR', MapDataOptions.COUNTRY_CAPITAL)).toEqual({
      name: 'France',
      capital: 'Paris',
    })
    expect(getCountryDetail('FR', MapDataOptions.COUNTRY_CURRENCY_INFO)).toMatchObject({
      currency: 'EUR',
    })
  })

  it('accepts lower-case codes', () => {
    expect(getCountryDetail('fr', MapDataOptions.COUNTRY_NAME)).toEqual({ name: 'France' })
  })

  it('returns undefined (does not throw) for unknown codes', () => {
    expect(getCountryDetail('ZZ', MapDataOptions.COUNTRY_COMPLETE_INFO)).toBeUndefined()
  })

  // Regression: lookups by display name failed for 14 countries (e.g. "Dem. Rep. Congo").
  it('resolves every country the map can draw', () => {
    const missing = isoCodes.filter((code) => !getCountryDetail(code, MapDataOptions.COUNTRY_CAPITAL)?.capital)
    expect(missing).toEqual([])
  })

  // Regression: France, Norway and Kosovo had no colour and stayed white in 'Colorful' mode.
  it('has a colour for every country the map can draw', () => {
    const uncoloured = isoCodes.filter((code) => !(code in countryColors))
    expect(uncoloured).toEqual([])
  })
})
