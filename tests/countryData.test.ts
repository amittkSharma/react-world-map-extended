import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, it } from 'vitest'
import schema from '../schema/country-data.schema.json'
import {
  COUNTRY_DATA_LIMITS,
  resolveCountryCode,
  validateCountryData,
} from '../src/lib/countryData'

describe('resolveCountryCode', () => {
  it.each([
    ['FR', 'FR'],
    ['fr', 'FR'],
    [' fr ', 'FR'],
    ['FRA', 'FR'],
    ['fra', 'FR'],
    ['DEU', 'DE'],
    ['XK', 'XK'],
    ['XKX', 'XK'],
    ['CYP', 'CY'], // ISO: Cyprus, not the map's "Northern Cyprus" area
    ['SOM', 'SO'], // ISO: Somalia, not "Somaliland"
  ])('%s -> %s', (input, expected) => {
    expect(resolveCountryCode(input)).toBe(expected)
  })

  it.each([
    ['France'],
    ['ZZ'],
    ['ZZZ'],
    [''],
    ['F'],
    ['FRAN'],
    [42],
    [null],
    [undefined],
    [['FR']],
  ])('rejects %j', (input) => {
    expect(resolveCountryCode(input)).toBeUndefined()
  })

  it('does not accept the map’s own non-ISO areas', () => {
    expect(resolveCountryCode('CY')).toBe('CY') // the real Cyprus
    expect(resolveCountryCode('Northern Cyprus')).toBeUndefined()
  })
})

const PROPS = [
  { name: 'Literacy rate (%)', color: '#1a73e8' },
  { name: 'Population', color: '#d55e00' },
]
const ONE = [{ name: 'Population', color: '#d55e00' }]

describe('validateCountryData', () => {
  it('accepts alpha-2 and alpha-3 rows and keeps the properties and their order as listed', () => {
    const { rows, properties, issues } = validateCountryData({
      properties: PROPS,
      countries: [
        { country: 'fr', Population: 68.2, 'Literacy rate (%)': 99 },
        { country: 'DEU', Population: 83200000 },
      ],
    })
    expect(issues).toEqual([])
    expect([...rows.keys()]).toEqual(['FR', 'DE'])
    expect(Object.keys(rows.get('FR') ?? {})).toEqual(['Literacy rate (%)', 'Population']) // as listed
    expect(rows.get('FR')).toEqual({ 'Literacy rate (%)': 99, Population: 68.2 })
    expect(rows.get('DE')).toEqual({ Population: 83200000 })
    expect(properties).toEqual([
      { name: 'Literacy rate (%)', color: '#1a73e8', min: 99, max: 99 },
      { name: 'Population', color: '#d55e00', min: 68.2, max: 83200000 },
    ])
  })

  it('leaves `country` out of the values, and ignores properties that are not listed', () => {
    const { rows, issues } = validateCountryData({
      properties: PROPS,
      countries: [
        { country: 'FR', Population: 1, 'Literacy rate (%)': 9, capital: 'Paris', extra: { a: 1 } },
      ],
    })
    expect(issues).toEqual([])
    expect(rows.get('FR')).toEqual({ Population: 1, 'Literacy rate (%)': 9 }) // listed order is kept
  })

  it('keeps null as "no value" for a property', () => {
    const { rows, issues } = validateCountryData({
      properties: PROPS,
      countries: [
        { country: 'FR', Population: 1, 'Literacy rate (%)': null },
        { country: 'DE', 'Literacy rate (%)': 5 },
      ],
    })
    expect(issues).toEqual([])
    expect(rows.get('FR')).toEqual({ 'Literacy rate (%)': null, Population: 1 })
  })

  it.each([
    ['an array', [{ country: 'FR', a: 1 }]],
    ['a string', 'FR'],
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
  ])('says so when the data is %s instead of an object', (_name, input) => {
    const { rows, properties, issues } = validateCountryData(input)
    expect(rows.size).toBe(0)
    expect(properties).toEqual([])
    expect(issues).toEqual([
      { row: null, message: 'The data must be an object with "properties" and "countries".' },
    ])
  })

  it('needs "properties" (a list with at least one entry) and "countries" (an array)', () => {
    for (const data of [
      { countries: [] },
      { properties: [], countries: [] },
      { properties: 'a', countries: [] },
    ]) {
      expect(validateCountryData(data).issues[0].message).toContain('"properties" must be a list')
    }
    const noCountries = validateCountryData({ properties: PROPS })
    expect(noCountries.issues[noCountries.issues.length - 1].message).toBe(
      '"countries" must be an array of objects.',
    )
    expect(noCountries.properties).toEqual([])
  })

  describe('the properties', () => {
    const check = (properties: unknown) =>
      validateCountryData({ properties, countries: [{ country: 'FR', Population: 1, A: 2 }] })

    it('need a name that is not empty', () => {
      for (const bad of [
        { color: '#336' },
        { name: '', color: '#336' },
        { name: '  ', color: '#336' },
        { name: 5, color: '#336' },
      ]) {
        const { issues } = check([bad, { name: 'Population', color: '#336' }])
        expect(issues[0]).toMatchObject({
          row: null,
          message: expect.stringContaining('properties[0] needs a "name"'),
        })
      }
    })

    it('need a hex colour (#rgb or #rrggbb, any case), and nothing else', () => {
      expect(check([{ name: 'Population', color: '#AbC' }]).issues).toEqual([])
      expect(check([{ name: 'Population', color: ' #3366aa ' }]).properties[0].color).toBe(
        '#3366aa',
      )
      for (const color of [
        'blue',
        '336',
        '#33',
        '#3366a',
        '#33666aa',
        'rgb(0,0,0)',
        '',
        undefined,
        7,
      ]) {
        const result = check([
          { name: 'Population', color },
          { name: 'A', color: '#336' },
        ])
        expect(result.issues[0]).toMatchObject({
          property: 'Population',
          message: expect.stringContaining('hex colour'),
        })
        expect(result.properties.map(({ name }) => name)).toEqual(['A']) // the other one still works
      }
    })

    it('are not objects: reported and left out', () => {
      const { issues, properties } = check(['Population', null, { name: 'A', color: '#336' }])
      expect(issues.map(({ message }) => message)).toEqual([
        'properties[0] must be an object { name, color }.',
        'properties[1] must be an object { name, color }.',
      ])
      expect(properties.map(({ name }) => name)).toEqual(['A'])
    })

    it('use the first entry of a name that is listed twice', () => {
      const { issues, properties } = check([
        { name: 'A', color: '#111' },
        { name: 'A', color: '#222' },
      ])
      expect(issues[0].message).toContain('listed more than once')
      expect(properties).toMatchObject([{ name: 'A', color: '#111' }])
    })

    it('cannot be named like a field of the row', () => {
      for (const name of ['country', 'infoLink']) {
        expect(
          check([
            { name, color: '#336' },
            { name: 'A', color: '#336' },
          ]).issues[0].message,
        ).toContain('field of the row')
      }
    })

    it('are left out when no row has a number for them', () => {
      const { issues, properties, rows } = validateCountryData({
        properties: [...PROPS, { name: 'Empty', color: '#336' }],
        countries: [{ country: 'FR', Population: 1, 'Literacy rate (%)': null, Empty: null }],
      })
      expect(properties.map(({ name }) => name)).toEqual(['Population'])
      expect(issues.map(({ property, message }) => [property, message])).toEqual([
        [
          'Literacy rate (%)',
          'No row has a number for "Literacy rate (%)"; the property is left out.',
        ],
        ['Empty', 'No row has a number for "Empty"; the property is left out.'],
      ])
      expect(rows.get('FR')).toEqual({ Population: 1 }) // their nulls are gone too
    })

    it('make the whole data unusable when none is left', () => {
      const { properties, rows, issues } = validateCountryData({ properties: PROPS, countries: [] })
      expect(properties).toEqual([])
      expect(rows.size).toBe(0)
      expect(issues).toHaveLength(2)
    })

    it('take a risky name as plain text', () => {
      const name = '__proto__'
      const { rows, properties, issues } = validateCountryData({
        properties: JSON.parse('[{"name":"__proto__","color":"#336"}]'),
        countries: JSON.parse('[{"country":"FR","__proto__":5}]'),
      })
      expect(issues).toEqual([])
      expect(properties[0].name).toBe(name)
      expect(Object.keys(rows.get('FR') ?? {})).toEqual([name])
      expect(Object.getPrototypeOf(rows.get('FR'))).toBe(Object.prototype)
    })

    it('are limited in number', () => {
      const many = Array.from({ length: COUNTRY_DATA_LIMITS.properties + 3 }, (_, i) => ({
        name: `p${i}`,
        color: '#336',
      }))
      const row = Object.fromEntries(many.map(({ name }) => [name, 1]))
      const { properties, issues } = validateCountryData({
        properties: many,
        countries: [{ country: 'FR', ...row }],
      })
      expect(properties).toHaveLength(COUNTRY_DATA_LIMITS.properties)
      expect(issues[0].message).toContain(
        `only the first ${COUNTRY_DATA_LIMITS.properties} are used`,
      )
    })
  })

  describe('the rows', () => {
    const rowsOf = (countries: unknown[]) => validateCountryData({ properties: ONE, countries })

    it('leave out rows that are not objects, and keep the others', () => {
      const { rows, issues } = rowsOf(['nope', null, 5, { country: 'FR', Population: 1 }])
      expect([...rows.keys()]).toEqual(['FR'])
      expect(issues.map(({ row, message }) => [row, message])).toEqual([
        [0, 'Each row must be an object.'],
        [1, 'Each row must be an object.'],
        [2, 'Each row must be an object.'],
      ])
    })

    it('need a country', () => {
      expect(rowsOf([{ Population: 1 }, { country: 'FR', Population: 1 }]).issues).toEqual([
        {
          row: 0,
          property: 'country',
          message: 'Missing "country" (an ISO alpha-2 or alpha-3 code).',
        },
      ])
    })

    it('do not accept names, only codes, and say so', () => {
      const { rows, issues } = rowsOf([{ country: 'France', Population: 1 }])
      expect(rows.size).toBe(0)
      expect(issues[0]).toMatchObject({
        row: 0,
        property: 'country',
        message: expect.stringContaining('names are not accepted'),
      })
    })

    it('reject codes the map does not know', () => {
      for (const country of ['ZZ', 'ZZZ', '', 'F', 'FRAN', 42, null]) {
        const { rows, issues } = rowsOf([{ country, Population: 1 }])
        expect(rows.size).toBe(0)
        expect(issues[0]).toMatchObject({ row: 0, property: 'country' })
      }
    })

    it('use the first row of a country that appears twice, whichever code form it uses', () => {
      const { rows, issues } = rowsOf([
        { country: 'FR', Population: 1 },
        { country: 'fra', Population: 2 },
      ])
      expect(rows.get('FR')).toEqual({ Population: 1 })
      expect(issues).toEqual([
        {
          row: 1,
          property: 'country',
          message: 'FR appears more than once; the first row is used.',
        },
      ])
    })

    it('need a number for at least one listed property', () => {
      for (const row of [
        { country: 'FR' },
        { country: 'FR', Population: null },
        { country: 'FR', other: 5 },
      ]) {
        const { rows, issues } = rowsOf([row, { country: 'DE', Population: 1 }])
        expect([...rows.keys()]).toEqual(['DE'])
        expect(issues[0]).toEqual({ row: 0, message: 'FR has no number for any listed property.' })
      }
    })

    it('accept finite numbers and null for a listed property, and nothing else', () => {
      const bad = [
        ['text', 'a'],
        ['text that looks like a number', '12'],
        ['a boolean', true],
        ['an array', [1]],
        ['an object', { a: 1 }],
        ['a non-finite number', Number.POSITIVE_INFINITY],
        ['a non-finite number', Number.NaN],
      ] as const
      for (const [kind, value] of bad) {
        const { rows, issues } = rowsOf([
          { country: 'FR', Population: value },
          { country: 'DE', Population: 1 },
        ])
        expect(issues, kind).toEqual([
          {
            row: 0,
            property: 'Population',
            message: expect.stringContaining('must be a finite number or null'),
          },
          { row: 0, message: 'FR has no number for any listed property.' },
        ])
        expect([...rows.keys()]).toEqual(['DE'])
      }
      expect(rowsOf([{ country: 'FR', Population: -3.5 }]).rows.get('FR')).toEqual({
        Population: -3.5,
      })
      expect(rowsOf([{ country: 'FR', Population: 0 }]).rows.get('FR')).toEqual({ Population: 0 })
    })

    it('keep a row whose other value is bad', () => {
      const { rows, issues } = validateCountryData({
        properties: PROPS,
        countries: [
          { country: 'FR', Population: 1, 'Literacy rate (%)': 'x' },
          { country: 'DE', 'Literacy rate (%)': 5 },
        ],
      })
      expect(rows.get('FR')).toEqual({ Population: 1 })
      expect(issues[0]).toMatchObject({ row: 0, property: 'Literacy rate (%)' })
    })

    it('treat undefined as "not there"', () => {
      const { rows, issues } = rowsOf([{ country: 'FR', Population: 1, Other: undefined }])
      expect(issues).toEqual([])
      expect(rows.get('FR')).toEqual({ Population: 1 })
    })

    it('keep infoLink when it is text, and report it when it is not', () => {
      const ok = rowsOf([{ country: 'FR', Population: 1, infoLink: 'https://example.org' }])
      expect(ok.rows.get('FR')).toEqual({ Population: 1, infoLink: 'https://example.org' })
      const bad = rowsOf([{ country: 'FR', Population: 1, infoLink: 5 }])
      expect(bad.issues).toEqual([
        {
          row: 0,
          property: 'infoLink',
          message: expect.stringContaining('"infoLink" must be text'),
        },
      ])
      expect(bad.rows.get('FR')).toEqual({ Population: 1 })
    })

    it('are limited in number', () => {
      const countries = Array.from({ length: COUNTRY_DATA_LIMITS.rows + 5 }, () => ({
        country: 'FR',
        Population: 1,
      }))
      const { issues } = rowsOf(countries)
      expect(issues[0].message).toContain(`only the first ${COUNTRY_DATA_LIMITS.rows} are used`)
    })
  })

  it('works out the lowest and highest number of each property', () => {
    const { properties } = validateCountryData({
      properties: [{ name: 'P', color: '#336' }],
      countries: [
        { country: 'FR', P: 5 },
        { country: 'DE', P: -2 },
        { country: 'JP', P: null },
        { country: 'BR', P: 40.5 },
      ],
    })
    expect(properties).toEqual([{ name: 'P', color: '#336', min: -2, max: 40.5 }])
  })

  it('never mutates its input', () => {
    const data = {
      properties: [...PROPS, { name: 'Empty', color: '#336' }],
      countries: [
        { country: 'fr', Population: 1, Empty: null },
        { country: 'FR', Population: 2 },
        'x',
      ],
    }
    const before = JSON.stringify(data)
    validateCountryData(data)
    expect(JSON.stringify(data)).toBe(before)
  })
})

describe('the JSON Schema file', () => {
  const validate = new Ajv2020({ strict: false }).compile(schema)
  const make = (countries: unknown, properties: unknown = ONE) => ({ properties, countries })

  it.each([
    [make([{ country: 'FR', Population: 1 }])],
    [make([{ country: 'FRA', Population: 99.5, Other: null }])],
    [make([{ country: ' de ', Population: 1, infoLink: 'https://example.org' }])],
    [make([{ country: 'FR', Population: 1, ignored: 'text' }])],
    [make([{ country: 'FR', Population: 1 }], [{ name: 'Population', color: '#AbC' }])],
  ])('accepts %j, as the validator does', (data) => {
    expect(validate(data)).toBe(true)
    expect(validateCountryData(data).issues).toEqual([])
  })

  it.each([
    [[{ country: 'FR', Population: 1 }]], // an array, not an object
    [{ countries: [{ country: 'FR', Population: 1 }] }],
    [{ properties: PROPS }],
    [make([], [])],
    [make([{ country: 'FR', Population: 1 }], [{ name: 'Population' }])],
    [make([{ country: 'FR', Population: 1 }], [{ name: 'Population', color: 'blue' }])],
    [make([{ country: 'FR', Population: 1 }], [{ name: '', color: '#336' }])],
    [make([{ Population: 1 }])],
    [make([{ country: 'France', Population: 1 }])],
    [make(['FR'])],
    [make([{ country: 'FR', Population: 1, infoLink: 5 }])],
  ])('rejects %j, and the validator reports it', (data) => {
    expect(validate(data)).toBe(false)
    expect(validateCountryData(data).issues.length).toBeGreaterThan(0)
  })

  it('is published with the package', async () => {
    const pkg = (await import('../package.json')).default
    expect(pkg.files).toContain('schema')
    expect(pkg.exports['./country-data.schema.json']).toBe('./schema/country-data.schema.json')
  })
})
