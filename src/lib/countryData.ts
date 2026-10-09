import { alpha3ToAlpha2 } from '../data/alpha3'
import { countryColors } from '../data/defaultMapData'
import { buildScale, type Scale, type ScaleKind, type ScaleOptions } from './scale'

/** What a value in your data can be. Numbers are what colour the map; `null` means "no value". */
export type CountryDataValue = string | number | boolean | null

/** One property to show and to colour the map by: its name (the label), the colour of its scale, and
 * how numbers become shades. */
export interface CountryDataProperty {
  /** The property's name in the rows. It is the label in the details and in the dropdown. */
  name: string
  /** The colour of the scale as a hex value (`#336` or `#3366aa`): the highest value gets this colour,
   * the lowest a light tint of it. */
  color: string
  /** `'linear'` (default): proportional. `'quantile'`: classes with the same number of countries, the
   * answer to a few very large numbers that make all others look alike. `'log'`: for numbers that span
   * orders of magnitude (all above zero). */
  // `string` is accepted so that a JSON file imported by TypeScript fits (it types "quantile" as
  // `string`); a name that is not a scale is reported when the data is checked
  scale?: ScaleKind | (string & Record<never, never>)
  /** Quantile only: the number of classes, from 2 to 9. Default 5. */
  classes?: number
  /** Numbers below `min` get the lightest shade, numbers above `max` the darkest. Default: the lowest and
   * highest number of the property. */
  min?: number
  max?: number
}

/** One row: a `country` (ISO 3166-1 alpha-2 or alpha-3 code) and a number per listed property. */
// `undefined` is allowed so that a JSON file imported by TypeScript fits: it types rows that lack a
// property as `prop?: undefined`. An undefined value is simply "not there" (as in JSON).
export type CountryDataRow = { country: string } & Record<string, CountryDataValue | undefined>

/** Your own data: the properties to show, and a row of numbers per country. */
export interface CountryData {
  properties: readonly CountryDataProperty[]
  countries: readonly CountryDataRow[]
}

export interface CountryDataIssue {
  /** Index of the row in `countries`, or `null` for a problem with the data as a whole or its `properties`. */
  row: number | null
  /** The property concerned, when it is about one property. */
  property?: string
  message: string
}

/** The values of one country: a number or null per listed property, in the order of `properties`
 * (plus `infoLink` when the row has one). */
export type CountryDataValues = Record<string, CountryDataValue>

/** A usable property with its scale worked out from the numbers it has in the rows. */
export interface ValidatedProperty extends Scale {
  name: string
  color: string
}

export interface ValidatedCountryData {
  /** The properties that can be used: valid, and with at least one number in the rows. */
  properties: ValidatedProperty[]
  /** Valid rows by the map's country code (upper-case alpha-2). */
  rows: Map<string, CountryDataValues>
  issues: CountryDataIssue[]
}

/** Limits that keep a data set small enough to render by hand. */
export const COUNTRY_DATA_LIMITS = { rows: 500, properties: 50, textLength: 2000 } as const

/** Names a property cannot have: the row's own fields. */
const RESERVED = ['country', 'infoLink']

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

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

/** A property that passed the checks of its name and colour; its scale options are checked later. */
interface ListedProperty {
  name: string
  color: string
  /** Where it is in `properties`, for messages. */
  where: string
  options: ScaleOptions
}

const validateProperties = (input: unknown, issues: CountryDataIssue[]): ListedProperty[] => {
  const limits = COUNTRY_DATA_LIMITS
  if (!Array.isArray(input) || input.length === 0) {
    issues.push({
      row: null,
      message: '"properties" must be a list with at least one { name, color } entry.',
    })
    return []
  }
  if (input.length > limits.properties) {
    issues.push({
      row: null,
      message: `"properties" has ${input.length} entries; only the first ${limits.properties} are used.`,
    })
  }

  const properties: ListedProperty[] = []
  input.slice(0, limits.properties).forEach((entry, index) => {
    const where = `properties[${index}]`
    if (!isPlainObject(entry)) {
      issues.push({ row: null, message: `${where} must be an object { name, color }.` })
      return
    }
    const { name, color, scale, classes, min, max } = entry
    if (typeof name !== 'string' || name.trim() === '') {
      issues.push({ row: null, message: `${where} needs a "name" (text, not empty).` })
      return
    }
    if (RESERVED.includes(name)) {
      issues.push({
        row: null,
        property: name,
        message: `${where}: "${name}" is a field of the row and cannot be a property.`,
      })
      return
    }
    if (typeof color !== 'string' || !HEX_COLOR.test(color.trim())) {
      issues.push({
        row: null,
        property: name,
        message: `${where}: "color" must be a hex colour like #336 or #3366aa.`,
      })
      return
    }
    if (properties.some((known) => known.name === name)) {
      issues.push({
        row: null,
        property: name,
        message: `${where}: "${name}" is listed more than once; the first entry is used.`,
      })
      return
    }
    properties.push({ name, color: color.trim(), where, options: { scale, classes, min, max } })
  })
  return properties
}

/**
 * Checks your own data against the schema and sorts it into what can be used and a list of what was
 * wrong (invalid parts are left out, valid ones are kept). The schema:
 * - the data is an object with `properties` and `countries`;
 * - `properties` is a list of 1 to 50 `{ name, color }`: a name (not empty, once, not `country` or
 *   `infoLink`) and a hex colour, and optionally `scale` (`linear`, `quantile` or `log`), `classes`
 *   (2 to 9, quantile only), `min` and `max`; options that cannot be used are reported and ignored;
 * - `countries` is a list of at most 500 objects, each with a `country`: an ISO 3166-1 alpha-2 or
 *   alpha-3 code the map knows (names are not accepted), at most once (the first row wins);
 * - a row's value for a listed property is a finite number, or `null` (no value); other properties of
 *   the row are ignored; `infoLink` is optional and only used when it is an http(s) URL;
 * - a listed property needs a number in at least one row, and a row needs a number for at least one
 *   listed property; otherwise they are left out.
 */
export const validateCountryData = (input: unknown): ValidatedCountryData => {
  const issues: CountryDataIssue[] = []
  const nothing = (): ValidatedCountryData => ({ properties: [], rows: new Map(), issues })
  const limits = COUNTRY_DATA_LIMITS

  if (!isPlainObject(input)) {
    issues.push({
      row: null,
      message: 'The data must be an object with "properties" and "countries".',
    })
    return nothing()
  }
  const properties = validateProperties(input.properties, issues)
  const countries = input.countries
  if (!Array.isArray(countries)) {
    issues.push({ row: null, message: '"countries" must be an array of objects.' })
    return nothing()
  }
  if (countries.length > limits.rows) {
    issues.push({
      row: null,
      message: `"countries" has ${countries.length} rows; only the first ${limits.rows} are used.`,
    })
  }

  const rows = new Map<string, CountryDataValues>()
  const isNumber = (value: unknown): value is number => typeof value === 'number'

  countries.slice(0, limits.rows).forEach((entry, row) => {
    if (!isPlainObject(entry)) {
      issues.push({ row, message: 'Each row must be an object.' })
      return
    }
    const { country, infoLink } = entry
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

    const values: CountryDataValues = {}
    for (const { name } of properties) {
      const value = entry[name]
      if (value === undefined) continue // not there, as in JSON
      if (value === null || (typeof value === 'number' && Number.isFinite(value))) {
        setValue(values, name, value)
      } else {
        const kind = Array.isArray(value) ? 'an array' : typeof value
        issues.push({
          row,
          property: name,
          message: `"${name}" must be a finite number or null (not ${kind === 'number' ? 'a non-finite number' : kind}).`,
        })
      }
    }
    if (infoLink !== undefined) {
      if (typeof infoLink !== 'string' || infoLink.length > limits.textLength) {
        issues.push({
          row,
          property: 'infoLink',
          message: `"infoLink" must be text of at most ${limits.textLength} characters.`,
        })
      } else {
        setValue(values, 'infoLink', infoLink)
      }
    }
    if (!Object.values(values).some(isNumber)) {
      issues.push({ row, message: `${code} has no number for any listed property.` })
      return
    }
    rows.set(code, values)
  })

  const usable: ValidatedProperty[] = []
  for (const property of properties) {
    const numbers = [...rows.values()].map((values) => values[property.name]).filter(isNumber)
    if (numbers.length === 0) {
      issues.push({
        row: null,
        property: property.name,
        message: `No row has a number for "${property.name}"; the property is left out.`,
      })
      for (const values of rows.values()) delete values[property.name]
    } else {
      const report = (message: string) =>
        issues.push({
          row: null,
          property: property.name,
          message: `${property.where}: ${message}`,
        })
      usable.push({
        name: property.name,
        color: property.color,
        ...buildScale(numbers, property.options, report),
      })
    }
  }
  if (usable.length === 0) return { properties: [], rows: new Map(), issues }

  return { properties: usable, rows, issues }
}
