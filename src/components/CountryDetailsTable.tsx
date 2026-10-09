import { useEffect, useRef, useState } from 'react'
import type { RevealRequest } from '../hooks/useAccordion'
import type { CountrySelection } from '../lib/cardSelections'
import { classNames } from '../lib/classNames'
import {
  buildTable,
  type Cell,
  findExtremes,
  NAME_KEY,
  type SortDirection,
  sortRows,
} from '../lib/comparisonTable'
import { displayValue } from '../lib/detailFormat'
import { scrollIntoCard } from '../lib/scrollIntoCard'
import { MAX_SELECTED_COUNTRIES, selectionCount } from '../lib/selectionLimit'
import { parseWebUrl } from '../lib/webUrl'
import { detailsStyles, tableStyles } from '../styles/detailsStyles'
import { visuallyHidden } from '../styles/mapStyles'
import type { CardAppearance } from '../types'
import { DetailsShell } from './DetailsShell'
import { SelectionBar } from './SelectionBar'

export interface CountryDetailsTableProps extends CardAppearance {
  /** The selected countries, in the order they were selected. */
  selections: CountrySelection[]
  /** The limit shown in the counter (`Infinity`: "n selected"). Default 5. */
  max?: number
  /** Ask the table to scroll one country into view, e.g. because it was clicked on the map. */
  reveal?: RevealRequest | null
  /** The country to mark, e.g. because the pointer is over it on the map. */
  highlightCode?: string | null
  /** Called with the country whose row the pointer or keyboard focus is on, or null. */
  onLink?: (code: string | null) => void
  /** When given, every row gets a remove button. */
  onRemove?: (code: string) => void
  /** When given, a "Clear all" button is shown. */
  onClear?: () => void
  /** When given, a "Hide" button is shown. */
  onClose?: () => void
  /** See `CountryDetails`: the table is the content of a dialog that already names it. */
  inDialog?: boolean
}

interface Sort {
  key: string
  direction: SortDirection
}

// ascending, then descending, then the order the countries were selected in
const nextSort = (current: Sort | null, key: string): Sort | null =>
  current?.key !== key
    ? { key, direction: 'asc' }
    : current.direction === 'asc'
      ? { key, direction: 'desc' }
      : null

const ariaSort = (sort: Sort | null, key: string) =>
  sort?.key !== key ? undefined : sort.direction === 'asc' ? 'ascending' : 'descending'

/**
 * Many selected countries side by side: one row per country, one column per fact. Headers sort the
 * rows (the selection itself is untouched) and the highest and lowest value of a numeric column are
 * marked, so countries can be compared at a glance.
 */
export const CountryDetailsTable = ({
  selections,
  max = MAX_SELECTED_COUNTRIES,
  reveal,
  highlightCode,
  onLink,
  onRemove,
  onClear,
  headingLevel = 3,
  className,
  inDialog = false,
  ...shell
}: CountryDetailsTableProps) => {
  const [sort, setSort] = useState<Sort | null>(null)
  const rowRefs = useRef(new Map<string, HTMLElement>())

  const { columns, rows } = buildTable(selections)
  const shown = sort ? sortRows(rows, sort.key, sort.direction) : rows

  useEffect(() => {
    const row = reveal && rowRefs.current.get(reveal.code)
    if (row) scrollIntoCard(row)
  }, [reveal])

  const header = (key: string, label: string) => (
    <th key={key} scope="col" aria-sort={ariaSort(sort, key)} style={tableStyles.head}>
      <button type="button" onClick={() => setSort(nextSort(sort, key))} style={tableStyles.sort}>
        {label}
        <span aria-hidden="true">
          {sort?.key === key ? (sort.direction === 'asc' ? ' ▲' : ' ▼') : ''}
        </span>
      </button>
    </th>
  )

  const cell = (key: string, value: Cell, extremes: ReturnType<typeof findExtremes>) => {
    const mark =
      extremes && value === extremes.max
        ? 'highest'
        : extremes && value === extremes.min
          ? 'lowest'
          : null
    return (
      <td key={key} style={tableStyles.cell}>
        {value === undefined ? '—' : displayValue(value)}
        {mark && (
          <span style={tableStyles.mark}>
            <span aria-hidden="true">{mark === 'highest' ? '▲' : '▼'}</span>
            <span style={visuallyHidden}> {mark} in this column</span>
          </span>
        )}
      </td>
    )
  }
  const extremesByColumn = new Map(columns.map(({ key }) => [key, findExtremes(rows, key)]))

  return (
    <DetailsShell
      {...shell}
      label="Selected countries"
      className={classNames('rwme-details--table', className)}
      look={detailsStyles.card}
      inDialog={inDialog}
    >
      <SelectionBar
        headingLevel={headingLevel}
        count={selectionCount(selections.length, max)}
        onClear={onClear}
      />
      {/* a table wider than the card scrolls here, so the keyboard must be able to reach it */}
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable region */}
      <section aria-label="Selected countries, compared" tabIndex={0} style={tableStyles.scroll}>
        <table style={tableStyles.table}>
          <caption style={visuallyHidden}>
            Selected countries. Use the column headers to sort.
          </caption>
          <thead>
            <tr>
              {header(NAME_KEY, 'Country')}
              {columns.map(({ key, label }) => header(key, label))}
              {onRemove && (
                <th scope="col" style={{ ...tableStyles.head, ...tableStyles.action }}>
                  <span style={visuallyHidden}>Remove</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => {
              const link = parseWebUrl(row.infoLink)
              const background =
                highlightCode === row.code
                  ? 'var(--rwme-panel-highlight, #eef4ff)'
                  : 'var(--rwme-panel-bg, #ffffff)'
              return (
                <tr
                  key={row.code}
                  data-code={row.code}
                  ref={(element) => {
                    if (element) rowRefs.current.set(row.code, element)
                    else rowRefs.current.delete(row.code)
                  }}
                  onMouseEnter={() => onLink?.(row.code)}
                  onMouseLeave={() => onLink?.(null)}
                  onFocus={() => onLink?.(row.code)}
                  onBlur={() => onLink?.(null)}
                  style={{ ...tableStyles.row, background }}
                >
                  <th scope="row" style={{ ...tableStyles.country, background }}>
                    {link ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${row.name} (opens in a new tab)`}
                        style={detailsStyles.link}
                      >
                        {row.name}
                      </a>
                    ) : (
                      row.name
                    )}
                  </th>
                  {columns.map(({ key }) =>
                    cell(key, row.cells[key], extremesByColumn.get(key) ?? null),
                  )}
                  {onRemove && (
                    <td style={{ ...tableStyles.action, background }}>
                      <button
                        type="button"
                        aria-label={`Remove ${row.name} from the selection`}
                        onClick={() => onRemove(row.code)}
                        style={tableStyles.remove}
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </DetailsShell>
  )
}
