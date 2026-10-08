import Ajv2020 from 'ajv/dist/2020'
import { describe, expect, it } from 'vitest'
import { COUNTRY_DATA_LIMITS, resolveCountryCode, validateCountryData } from '../src/countryData'
import schema from '../schema/country-data.schema.json'

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

  it.each([['France'], ['ZZ'], ['ZZZ'], [''], ['F'], ['FRAN'], [42], [null], [undefined], [['FR']]])(
    'rejects %j',
    (input) => {
      expect(resolveCountryCode(input)).toBeUndefined()
    },
  )

  it('does not accept the map’s own non-ISO areas', () => {
    expect(resolveCountryCode('CY')).toBe('CY') // the real Cyprus
    expect(resolveCountryCode('Northern Cyprus')).toBeUndefined()
  })
})

describe('validateCountryData', () => {
  it('accepts alpha-2 and alpha-3 rows and keeps the property names and order as written', () => {
    const { rows, issues } = validateCountryData([
      { country: 'fr', 'Literacy rate (%)': 99, capital_city: 'Paris', hasCoast: true },
      { country: 'DEU', Population: 83000000, note: null },
    ])
    expect(issues).toEqual([])
    expect([...rows.keys()]).toEqual(['FR', 'DE'])
    expect(rows.get('FR')).toEqual({ 'Literacy rate (%)': 99, capital_city: 'Paris', hasCoast: true })
    expect(Object.keys(rows.get('FR') ?? {})).toEqual(['Literacy rate (%)', 'capital_city', 'hasCoast'])
    expect(rows.get('DE')).toEqual({ Population: 83000000, note: null })
  })

  it('leaves `country` out of the values', () => {
    const { rows } = validateCountryData([{ country: 'FR', a: 1 }])
    expect(rows.get('FR')).not.toHaveProperty('country')
  })

  it.each([
    ['an object', { country: 'FR', a: 1 }],
    ['a string', 'FR'],
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
  ])('says so when the data is %s instead of an array', (_name, input) => {
    const { rows, issues } = validateCountryData(input)
    expect(rows.size).toBe(0)
    expect(issues).toEqual([{ row: null, message: 'The data must be an array of objects.' }])
  })

  it('accepts an empty array (no countries have data)', () => {
    expect(validateCountryData([])).toEqual({ rows: new Map(), issues: [] })
  })

  it('leaves out rows that are not objects, and keeps the others', () => {
    const { rows, issues } = validateCountryData([42, null, ['FR'], { country: 'FR', a: 1 }])
    expect([...rows.keys()]).toEqual(['FR'])
    expect(issues.map((issue) => issue.row)).toEqual([0, 1, 2])
    expect(issues.every((issue) => issue.message === 'Each row must be an object.')).toBe(true)
  })

  it('needs a country', () => {
    const { rows, issues } = validateCountryData([{ a: 1 }])
    expect(rows.size).toBe(0)
    expect(issues).toEqual([
      { row: 0, property: 'country', message: expect.stringContaining('Missing "country"') },
    ])
  })

  it('does not accept names, only codes, and says so', () => {
    const { rows, issues } = validateCountryData([{ country: 'France', a: 1 }])
    expect(rows.size).toBe(0)
    expect(issues[0]).toMatchObject({ row: 0, property: 'country' })
    expect(issues[0].message).toContain('names are not accepted')
  })

  it('rejects codes the map does not know', () => {
    const { rows, issues } = validateCountryData([
      { country: 'ZZ', a: 1 },
      { country: 'QQQ', a: 1 },
      { country: 7, a: 1 },
    ])
    expect(rows.size).toBe(0)
    expect(issues).toHaveLength(3)
  })

  it('uses the first row of a country that appears twice, whichever code form it uses', () => {
    const { rows, issues } = validateCountryData([
      { country: 'FR', a: 1 },
      { country: 'FRA', a: 2 },
      { country: 'fr', a: 3 },
    ])
    expect(rows.get('FR')).toEqual({ a: 1 })
    expect(issues.map((issue) => issue.row)).toEqual([1, 2])
    expect(issues[0].message).toContain('more than once')
  })

  it('needs at least one usable value besides the country', () => {
    const { rows, issues } = validateCountryData([{ country: 'FR' }, { country: 'DE', x: { deep: 1 } }])
    expect(rows.size).toBe(0)
    expect(issues.some((issue) => issue.row === 0 && issue.message.includes('no usable values'))).toBe(true)
    expect(issues.some((issue) => issue.row === 1 && issue.message.includes('no usable values'))).toBe(true)
  })

  it('accepts text, finite numbers, true / false and null, and nothing else', () => {
    const { rows, issues } = validateCountryData([
      {
        country: 'FR',
        text: 'a',
        empty: '',
        int: 3,
        float: 1.5,
        zero: 0,
        negative: -2,
        yes: true,
        no: false,
        none: null,
        obj: { a: 1 },
        list: [1, 2],
        nan: Number.NaN,
        inf: Number.POSITIVE_INFINITY,
        undef: undefined,
        fn: () => 1,
      },
    ])
    expect(Object.keys(rows.get('FR') ?? {})).toEqual([
      'text',
      'empty',
      'int',
      'float',
      'zero',
      'negative',
      'yes',
      'no',
      'none',
    ])
    expect(issues.map((issue) => issue.property).sort()).toEqual(['fn', 'inf', 'list', 'nan', 'obj'].sort()) // `undef` is just "not there"
    expect(issues.find((issue) => issue.property === 'list')?.message).toContain('an array')
    expect(issues.find((issue) => issue.property === 'obj')?.message).toContain('object')
  })

  it('keeps a row when only some of its values are bad', () => {
    const { rows, issues } = validateCountryData([{ country: 'FR', good: 1, bad: { x: 1 } }])
    expect(rows.get('FR')).toEqual({ good: 1 })
    expect(issues).toHaveLength(1)
  })

  it('leaves out a property with an empty name', () => {
    const { rows, issues } = validateCountryData([{ country: 'FR', '': 1, ' ': 2, ok: 3 }])
    expect(rows.get('FR')).toEqual({ ok: 3 })
    expect(issues).toHaveLength(2)
  })

  it('treats risky property names as plain text labels', () => {
    const data = JSON.parse('[{"country":"FR","__proto__":"x","constructor":"y","toString":"z"}]')
    const { rows, issues } = validateCountryData(data)
    expect(issues).toEqual([])
    expect(Object.keys(rows.get('FR') ?? {}).sort()).toEqual(['__proto__', 'constructor', 'toString'].sort())
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it('enforces the limits: rows, properties per row, text length', () => {
    const limits = COUNTRY_DATA_LIMITS
    const many = Array.from({ length: limits.rows + 5 }, () => ({ country: 'FR', a: 1 }))
    expect(validateCountryData(many).issues[0].row).toBeNull()

    const wide = { country: 'FR', ...Object.fromEntries(Array.from({ length: limits.properties + 3 }, (_, i) => [`p${i}`, i])) }
    const wideResult = validateCountryData([wide])
    expect(Object.keys(wideResult.rows.get('FR') ?? {})).toHaveLength(limits.properties)
    expect(wideResult.issues[0].message).toContain(`More than ${limits.properties} properties`)

    const long = validateCountryData([{ country: 'FR', short: 'ok', long: 'x'.repeat(limits.textLength + 1) }])
    expect(long.rows.get('FR')).toEqual({ short: 'ok' })
    expect(long.issues[0].property).toBe('long')
  })

  it('reports where a problem is (row index and property)', () => {
    const { issues } = validateCountryData([{ country: 'FR', a: 1 }, { country: 'DE', b: [1] }, { country: 'IT', c: 1 }])
    expect(issues).toEqual([{ row: 1, property: 'b', message: expect.any(String) }, { row: 1, message: expect.stringContaining('no usable values') }])
  })

  it('never mutates its input', () => {
    const input = [{ country: 'fr', a: 1 }]
    const copy = JSON.parse(JSON.stringify(input))
    validateCountryData(input)
    expect(input).toEqual(copy)
  })
})

// The published JSON Schema and the validator must agree on everything the schema can express.
describe('the JSON Schema file', () => {
  const validate = new Ajv2020({ strict: false }).compile(schema)

  it.each([
    [[{ country: 'FR', a: 1 }]],
    [[{ country: 'FRA', 'Literacy rate (%)': 99.5, ok: true, nothing: null, text: 'x' }]],
    [[{ country: ' de ', a: 'b', infoLink: 'https://example.org' }]],
    [[]],
  ])('accepts %j, as the validator does', (data) => {
    expect(validate(data)).toBe(true)
    expect(validateCountryData(data).issues).toEqual([])
  })

  it.each([
    [{ country: 'FR', a: 1 }],
    [[{ a: 1 }]],
    [[{ country: 'FR' }]],
    [[{ country: 'France', a: 1 }]],
    [[{ country: 'FR', a: { b: 1 } }]],
    [[{ country: 'FR', a: [1] }]],
    [[{ country: 'FR', '': 1 }]],
    [[{ country: 'FR', a: 'x'.repeat(2001) }]],
    [['FR']],
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
