import type { CountrySelection } from './cardSelections'
import type { CountryDataValue } from './countryData'
import { type Field, formatValue, labels } from './detailFormat'

export type Cell = CountryDataValue | undefined

export interface Column {
  /** Unique: built-in facts and your own properties can share a name. */
  key: string
  label: string
}

export interface TableRow {
  code: string
  name: string
  infoLink?: string
  cells: Record<string, Cell>
}

export type SortDirection = 'asc' | 'desc'

/** The key of the country-name column, which every table has. */
export const NAME_KEY = 'name'

// the built-in facts in the order they appear; the card's short labels are ambiguous side by side
const FIELDS: Field[] = [
  'capital',
  'region',
  'continent',
  'currency',
  'symbol',
  'currencyName',
  'language',
  'isdCodes',
]
const COLUMN_LABELS: Partial<Record<Field, string>> = {
  ...labels,
  currency: 'Currency code',
  symbol: 'Currency symbol',
  currencyName: 'Currency name',
}

const isEmpty = (value: Cell) => value === undefined || value === null || value === ''

/**
 * One row per selected country and one column per fact any of them has: the built-in facts first,
 * then your own properties in the order they first appear. What a source hides gets no column.
 */
export const buildTable = (selections: readonly CountrySelection[]) => {
  const columns: Column[] = []
  const rows: TableRow[] = selections.map(({ code, name, detail, custom, source = 'default' }) => {
    const cells: Record<string, Cell> = {}
    if (source !== 'custom') {
      for (const field of FIELDS) {
        const value = detail?.[field]
        if (isEmpty(value as Cell)) continue
        cells[`fact:${field}`] = formatValue(field, value as NonNullable<typeof value>)
      }
    }
    if (source !== 'default') {
      for (const [property, value] of Object.entries(custom ?? {})) {
        if (property !== 'infoLink') cells[`data:${property}`] = value
      }
    }
    return { code, name: detail?.name ?? name, infoLink: detail?.infoLink, cells }
  })

  for (const field of FIELDS) {
    if (rows.some((row) => `fact:${field}` in row.cells)) {
      columns.push({ key: `fact:${field}`, label: COLUMN_LABELS[field] ?? field })
    }
  }
  for (const row of rows) {
    for (const key of Object.keys(row.cells)) {
      if (key.startsWith('data:') && !columns.some((column) => column.key === key)) {
        columns.push({ key, label: key.slice('data:'.length) })
      }
    }
  }
  return { columns, rows }
}

const cellOf = (row: TableRow, key: string): Cell => (key === NAME_KEY ? row.name : row.cells[key])

const compare = (a: Cell, b: Cell) =>
  typeof a === 'number' && typeof b === 'number'
    ? a - b
    : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })

/** The rows ordered by a column; rows without a value come last in either direction. The input is untouched. */
export const sortRows = (rows: readonly TableRow[], key: string, direction: SortDirection) =>
  [...rows].sort((a, b) => {
    const [left, right] = [cellOf(a, key), cellOf(b, key)]
    if (isEmpty(left) || isEmpty(right)) return Number(isEmpty(left)) - Number(isEmpty(right))
    return direction === 'asc' ? compare(left, right) : compare(right, left)
  })

/**
 * The highest and lowest value of a column, only when they mean something: at least two values, all
 * of them numbers, and not all the same.
 */
export const findExtremes = (rows: readonly TableRow[], key: string) => {
  const values = rows.map((row) => row.cells[key]).filter((value) => !isEmpty(value))
  if (values.length < 2 || !values.every((value) => typeof value === 'number')) return null
  const numbers = values as number[]
  const [min, max] = [Math.min(...numbers), Math.max(...numbers)]
  return min === max ? null : { min, max }
}
