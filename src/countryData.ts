import { countryColors } from './rawData/defaultMapData'
import { alpha3ToAlpha2 } from './rawData/alpha3'

/** What a custom value can be. */
export type CountryDataValue = string | number | boolean | null

/** One row of your own data: a `country` (ISO 3166-1 alpha-2 or alpha-3 code) and the values to show. */
// `undefined` is allowed so that a JSON file imported by TypeScript fits: it types rows that lack a
// property as `prop?: undefined`. An undefined value is simply "not there" (as in JSON).
export type CountryDataRow = { country: string } & Record<string, CountryDataValue | undefined>

export interface CountryDataIssue {
  /** Index of the row in the array, or `null` for a problem with the data as a whole. */
  row: number | null
  /** The property concerned, when it is about one property. */
  property?: string
  message: string
}

/** The values of one country, in the order they were written, without `country`. */
export type CountryDataValues = Record<string, CountryDataValue>

export interface ValidatedCountryData {
  /** Valid rows by the map's country code (upper-case alpha-2). */
  rows: Map<string, CountryDataValues>
  issues: CountryDataIssue[]
}

/** Limits that keep a data set small enough to render by hand. */
export const COUNTRY_DATA_LIMITS = { rows: 500, properties: 50, textLength: 2000 } as const

const ALPHA2 = new Set(Object.keys(countryColors))

// A label is whatever the data says, even `__proto__`: define it as an own property, never assign it
const setValue = (target: CountryDataValues, name: string, value: CountryDataValue) => {
  Object.defineProperty(target, name, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  })
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Maps an ISO alpha-2 or alpha-3 code (any case, spaces around are ignored) to the map's code. */
export const resolveCountryCode = (input: unknown): string | undefined => {
  if (typeof input !== 'string') return undefined
  const code = input.trim().toUpperCase()
  if (code.length === 2) return ALPHA2.has(code) ? code : undefined
  if (code.length === 3) return alpha3ToAlpha2[code]
  return undefined
}

/**
 * Checks your own data against the schema and sorts it into the rows that can be used and a list of
 * what was wrong (invalid rows are left out, valid ones are kept). The schema:
 * - the data is an array of at most 500 objects;
 * - each object has a `country`: an ISO 3166-1 alpha-2 or alpha-3 code the map knows (names are not
 *   accepted), at most once in the whole array (the first row wins);
 * - and at least one more property, at most 50, each with a non-empty name; its value is text (at most
 *   2000 characters), a finite number, true / false or null: no objects, no arrays (`undefined` counts
 *   as "not there");
 * - `infoLink` is optional and is only used when it is an http(s) URL.
 */
export const validateCountryData = (input: unknown): ValidatedCountryData => {
  const rows = new Map<string, CountryDataValues>()
  const issues: CountryDataIssue[] = []
  const limits = COUNTRY_DATA_LIMITS

  if (!Array.isArray(input)) {
    issues.push({ row: null, message: 'The data must be an array of objects.' })
    return { rows, issues }
  }
  if (input.length > limits.rows) {
    issues.push({
      row: null,
      message: `The data has ${input.length} rows; only the first ${limits.rows} are used.`,
    })
  }

  input.slice(0, limits.rows).forEach((entry, row) => {
    if (!isPlainObject(entry)) {
      issues.push({ row, message: 'Each row must be an object.' })
      return
    }
    const { country, ...rest } = entry
    if (country === undefined) {
      issues.push({
        row,
        property: 'country',
        message: 'Missing "country" (an ISO alpha-2 or alpha-3 code).',
      })
      return
    }
    const code = resolveCountryCode(country)
    if (!code) {
      issues.push({
        row,
        property: 'country',
        message: `"${String(country)}" is not an ISO 3166-1 alpha-2 or alpha-3 code of a country on the map (names are not accepted).`,
      })
      return
    }
    if (rows.has(code)) {
      issues.push({
        row,
        property: 'country',
        message: `${code} appears more than once; the first row is used.`,
      })
      return
    }

    const names = Object.keys(rest)
    if (names.length > limits.properties) {
      issues.push({
        row,
        message: `More than ${limits.properties} properties; only the first ${limits.properties} are used.`,
      })
    }
    const values: CountryDataValues = {}
    for (const name of names.slice(0, limits.properties)) {
      const value = rest[name]
      if (value === undefined) {
        // not there, as in JSON
      } else if (name.trim() === '') {
        issues.push({ row, message: 'A property has an empty name and is left out.' })
      } else if (value === null || typeof value === 'boolean') {
        setValue(values, name, value)
      } else if (typeof value === 'number') {
        if (Number.isFinite(value)) setValue(values, name, value)
        else issues.push({ row, property: name, message: `"${name}" must be a finite number.` })
      } else if (typeof value === 'string') {
        if (value.length <= limits.textLength) setValue(values, name, value)
        else
          issues.push({
            row,
            property: name,
            message: `"${name}" is longer than ${limits.textLength} characters.`,
          })
      } else {
        issues.push({
          row,
          property: name,
          message: `"${name}" must be text, a number, true / false or null (not ${Array.isArray(value) ? 'an array' : typeof value}).`,
        })
      }
    }
    if (Object.keys(values).length === 0) {
      issues.push({ row, message: `${code} has no usable values besides "country".` })
      return
    }
    rows.set(code, values)
  })

  return { rows, issues }
}
