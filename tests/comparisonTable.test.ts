import { describe, expect, it } from 'vitest'
import { buildSelections } from '../src/lib/cardSelections'
import { buildTable, findExtremes, sortRows, type TableRow } from '../src/lib/comparisonTable'

const row = (code: string, cells: TableRow['cells'], name = code): TableRow => ({
  code,
  name,
  cells,
})

describe('buildTable', () => {
  const select = (
    codes: string[],
    source: 'default' | 'custom' | 'both',
    rows?: Map<string, Record<string, number | null>>,
  ) =>
    buildTable(
      buildSelections(codes, {
        source,
        rows,
        infoMode: 'CountryCompleteInfo',
        getInfoLink: undefined,
      }),
    )

  it('has the built-in facts of every country, in a fixed order', () => {
    const { columns, rows } = select(['FR', 'DE'], 'default')
    expect(columns.map((column) => column.label).slice(0, 3)).toEqual([
      'Capital',
      'Region',
      'Continent',
    ])
    expect(rows.map((r) => r.name)).toEqual(['France', 'Germany'])
    expect(rows[0].cells['fact:capital']).toBe('Paris')
  })

  it('adds your own properties after the facts, and keeps same-named ones apart', () => {
    const data = new Map<string, Record<string, number | null>>([
      ['FR', { Capital: 1, Visitors: 90 }],
      ['DE', { Visitors: 40 }],
    ])
    const { columns, rows } = select(['FR', 'DE'], 'both', data)
    const keys = columns.map((column) => column.key)
    expect(keys).toContain('fact:capital')
    expect(keys.slice(-2)).toEqual(['data:Capital', 'data:Visitors'])
    expect(rows[1].cells['data:Capital']).toBeUndefined()
  })

  it('shows only your data for the custom source and only facts for the default one', () => {
    const data = new Map([['FR', { Visitors: 90 }]])
    expect(select(['FR'], 'custom', data).columns.map((c) => c.key)).toEqual(['data:Visitors'])
    expect(select(['FR'], 'default', data).columns.every((c) => c.key.startsWith('fact:'))).toBe(
      true,
    )
  })

  it('keeps a country without details as a row with no cells', () => {
    const { columns, rows } = buildTable([{ code: 'ZZ', name: 'Nowhere', detail: undefined }])
    expect(columns).toEqual([])
    expect(rows).toEqual([{ code: 'ZZ', name: 'Nowhere', infoLink: undefined, cells: {} }])
  })
})

describe('sortRows', () => {
  const rows = [row('A', { v: 5 }), row('B', { v: null }), row('C', { v: 20 }), row('D', {})]

  it('sorts numbers by value, not as text', () => {
    expect(sortRows(rows, 'v', 'asc').map((r) => r.code)).toEqual(['A', 'C', 'B', 'D'])
    expect(sortRows(rows, 'v', 'desc').map((r) => r.code)).toEqual(['C', 'A', 'B', 'D'])
  })

  it('sorts by country name and leaves the input alone', () => {
    const named = [row('1', {}, 'Spain'), row('2', {}, 'France')]
    expect(sortRows(named, 'name', 'asc').map((r) => r.name)).toEqual(['France', 'Spain'])
    expect(named[0].name).toBe('Spain')
  })

  it('compares text when a column mixes numbers and words', () => {
    const mixed = [row('A', { v: 'b' }), row('B', { v: 10 }), row('C', { v: 9 })]
    expect(sortRows(mixed, 'v', 'asc').map((r) => r.code)).toEqual(['C', 'B', 'A'])
  })
})

describe('findExtremes', () => {
  it('finds the highest and lowest of a numeric column', () => {
    expect(findExtremes([row('A', { v: 5 }), row('B', { v: 20 }), row('C', {})], 'v')).toEqual({
      min: 5,
      max: 20,
    })
  })

  it('finds nothing when there is nothing to compare', () => {
    expect(findExtremes([row('A', { v: 5 })], 'v')).toBeNull() // one value
    expect(findExtremes([row('A', { v: 5 }), row('B', { v: 5 })], 'v')).toBeNull() // all equal
    expect(findExtremes([row('A', { v: 5 }), row('B', { v: 'x' })], 'v')).toBeNull() // not all numbers
  })

  it('counts null as empty, not as zero', () => {
    expect(
      findExtremes([row('A', { v: null }), row('B', { v: 3 }), row('C', { v: 4 })], 'v'),
    ).toEqual({
      min: 3,
      max: 4,
    })
  })
})
