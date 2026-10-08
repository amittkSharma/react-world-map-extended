import type { CSSProperties } from 'react'
import { continentNames } from './palettes'
import { MAX_SELECTED_COUNTRIES } from './selectionLimit'
import type { CountryDataValue, CountryDataValues } from './countryData'
import type { CountryDetail } from './rawData/getDefaultMapData'

type Field = Exclude<keyof CountryDetail, 'infoLink'>

// Information is grouped by category; `emphasis` marks the one fact that deserves most weight.
const groups: Array<{ title: string; fields: Field[]; emphasis?: Field }> = [
  { title: 'Geography', fields: ['capital', 'region', 'continent'], emphasis: 'capital' },
  { title: 'Currency', fields: ['currency', 'symbol', 'currencyName'], emphasis: 'currency' },
  { title: 'Language', fields: ['language'], emphasis: 'language' },
  { title: 'Calling codes', fields: ['isdCodes'], emphasis: 'isdCodes' },
]

const labels: Partial<Record<Field, string>> = {
  capital: 'Capital',
  region: 'Region',
  continent: 'Continent',
  currency: 'Code',
  symbol: 'Symbol',
  currencyName: 'Name',
  language: 'Official language',
  isdCodes: 'Dialling prefix',
}

const formatValue = (field: Field, value: NonNullable<CountryDetail[Field]>): string => {
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

// Colours can be themed with --rwme-panel-* custom properties.
const card: CSSProperties = {
  position: 'relative',
  boxSizing: 'border-box',
  width: '100%',
  padding: '1rem 1.25rem',
  borderRadius: 8,
  border: '1px solid var(--rwme-panel-border, #d0d7de)',
  borderLeft: '4px solid var(--rwme-panel-accent, #0969da)',
  background: 'var(--rwme-panel-bg, #ffffff)',
  color: 'var(--rwme-panel-text, #1f2328)',
  fontSize: '0.95rem',
  lineHeight: 1.4,
}

export const detailsStyles = {
  card,
  empty: {
    ...card,
    border: '1px dashed var(--rwme-panel-border, #d0d7de)',
    color: 'var(--rwme-panel-muted, #59636e)',
  },
  warning: {
    ...card,
    borderLeft: '4px solid var(--rwme-panel-warning, #bf8700)',
    background: 'var(--rwme-panel-warning-bg, #fff8c5)',
  },
  title: { margin: 0, paddingRight: '5rem', fontSize: '1.4rem', fontWeight: 650, lineHeight: 1.2 },
  close: {
    position: 'absolute',
    top: '0.6rem',
    right: '0.75rem',
    padding: '0.3rem 0.75rem', // a comfortable touch target
    border: '1px solid var(--rwme-panel-border, #d0d7de)',
    borderRadius: 6,
    background: 'var(--rwme-panel-bg, #ffffff)',
    color: 'var(--rwme-panel-text, #1f2328)',
    fontFamily: 'inherit',
    fontStyle: 'inherit',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))',
    gap: '1rem 2rem',
    margin: '1rem 0 0',
  },
  groupTitle: {
    margin: '0 0 0.4rem',
    paddingBottom: '0.25rem',
    borderBottom: '1px solid var(--rwme-panel-border, #d0d7de)',
    color: 'var(--rwme-panel-muted, #59636e)',
    fontSize: '0.7rem',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  term: { margin: 0, color: 'var(--rwme-panel-muted, #59636e)', fontSize: '0.75rem' },
  value: { margin: '0 0 0.5rem' },
  emphasised: { margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 600 },
  footer: {
    margin: '1rem 0 0',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--rwme-panel-border, #d0d7de)',
    color: 'var(--rwme-panel-muted, #59636e)',
    fontSize: '0.85rem',
  },
  link: { color: 'var(--rwme-panel-accent, #0969da)' },
  paragraph: { margin: 0 },
  note: { margin: '0.75rem 0 0', color: 'var(--rwme-panel-muted, #59636e)', fontSize: '0.85rem' },
  customList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
    gap: '0.5rem 2rem',
    margin: 0,
  },
} satisfies Record<string, CSSProperties>
const styles = detailsStyles

/** `infoLink` may come from consumer code: only ever render http(s) URLs (never e.g. `javascript:`). */
export const parseWebUrl = (value: string | undefined): URL | undefined => {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : undefined
  } catch {
    return undefined
  }
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export const headingTag = (level: number) => `h${Math.min(level, 6)}` as `h${HeadingLevel}`

/** Which facts a card shows: the built-in ones, your own (`countryData`), or both. */
export type DetailsSource = 'default' | 'custom' | 'both'

/** One country as the card shows it. */
export interface SelectionContent {
  name: string
  /** The built-in facts; `undefined` for areas without data (Northern Cyprus, Somaliland). */
  detail: CountryDetail | undefined
  /** Your own values for this country, if you gave any. */
  custom?: CountryDataValues | null
  /** Default `'default'`. */
  source?: DetailsSource
}

/** Whether there is anything to show for the country with the chosen source. */
export const hasContent = ({ detail, custom, source = 'default' }: SelectionContent) =>
  source === 'custom'
    ? Boolean(custom)
    : source === 'both'
      ? Boolean(custom || detail)
      : Boolean(detail)

export const missingMessage = ({ name, source = 'default' }: SelectionContent) =>
  source === 'default' ? `No details available for ${name}.` : `No data for ${name}.`

const displayValue = (value: CountryDataValue) => (value === null ? '—' : String(value))

/** Your own values, labelled exactly as their property names (`infoLink` is not a value: it is the link). */
const CustomValues = ({
  values,
  groupHeadingLevel,
}: {
  values: CountryDataValues
  groupHeadingLevel: number
}) => {
  const entries = Object.entries(values).filter(([label]) => label !== 'infoLink')
  if (entries.length === 0) return null
  const GroupTitle = headingTag(groupHeadingLevel)
  return (
    <div className="rwme-details__custom" style={styles.grid}>
      <div style={{ gridColumn: '1 / -1' }}>
        <GroupTitle style={styles.groupTitle}>Data</GroupTitle>
        <dl style={styles.customList}>
          {entries.map(([label, value]) => (
            <div key={label}>
              <dt style={styles.term}>{label}</dt>
              <dd style={styles.value}>{displayValue(value)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

/** The body of a country's card for any source (the caller supplies the title). */
export const SelectionBody = ({
  content,
  groupHeadingLevel,
}: {
  content: SelectionContent
  groupHeadingLevel: number
}) => {
  const { name, detail, custom, source = 'default' } = content
  return (
    <>
      {source !== 'default' && custom && (
        <CustomValues values={custom} groupHeadingLevel={groupHeadingLevel} />
      )}
      {source === 'both' && !custom && <p style={styles.note}>No custom data for {name}.</p>}
      {detail && (
        <DetailsBody
          name={detail.name ?? name}
          detail={detail}
          groupHeadingLevel={groupHeadingLevel}
        />
      )}
    </>
  )
}

export interface CountryDetailsProps {
  /** The country to show; `null` shows a hint to click a country. `detail` is `undefined` for areas without data. */
  selection: SelectionContent | null
  /** Level of the country-name heading (`h1`–`h6`); the category headings use the next level. Default 3. */
  headingLevel?: HeadingLevel
  /** CSS `font-family` of the whole card. Default: inherited from the host page. */
  fontFamily?: string
  /** CSS `font-style` of the whole card. Default: inherited from the host page. */
  fontStyle?: CSSProperties['fontStyle']
  className?: string
  /** Merged over the card's own style, last. */
  style?: CSSProperties
  /** When given, a "Hide" button is shown and calls this. */
  onClose?: () => void
  /** Set when the card is the content of a dialog that already names and announces it. The card then
   * is a plain polite live area instead of a second, separately named `status` region, which would
   * make a screen reader announce the same content twice. */
  inDialog?: boolean
}

/** The grouped facts of one country and its `infoLink`, without a title (the caller supplies it). */
export const DetailsBody = ({
  name,
  detail,
  groupHeadingLevel,
}: {
  name: string
  detail: CountryDetail
  groupHeadingLevel: number
}) => {
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      fields: group.fields.filter((field) => detail[field] !== undefined && detail[field] !== ''),
    }))
    .filter((group) => group.fields.length > 0)
  const infoUrl = parseWebUrl(detail.infoLink)
  const host = infoUrl?.hostname.replace(/^www\./, '')
  const GroupTitle = headingTag(groupHeadingLevel)

  return (
    <>
      {visibleGroups.length > 0 && (
        <div style={styles.grid}>
          {visibleGroups.map((group) => (
            <div key={group.title}>
              <GroupTitle style={styles.groupTitle}>{group.title}</GroupTitle>
              <dl style={{ margin: 0 }}>
                {group.fields.map((field) => (
                  <div key={field}>
                    <dt style={styles.term}>{labels[field] ?? field}</dt>
                    <dd style={field === group.emphasis ? styles.emphasised : styles.value}>
                      {formatValue(field, detail[field] as NonNullable<CountryDetail[Field]>)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}
      {infoUrl && (
        <p className="rwme-details__link" style={styles.footer}>
          More information:{' '}
          <a
            href={infoUrl.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`More information about ${name} on ${host} (opens in a new tab)`}
            style={styles.link}
          >
            {host} ↗
          </a>
        </p>
      )}
    </>
  )
}

/** Live region (screen readers announce updates) showing the selected country's details. */
export const CountryDetails = ({
  selection,
  headingLevel = 3,
  fontFamily,
  fontStyle,
  className,
  style: styleOverride,
  onClose,
  inDialog = false,
}: CountryDetailsProps) => {
  const content = selection ? hasContent(selection) : false

  const Title = headingTag(headingLevel)

  const base = !selection ? styles.empty : content ? styles.card : styles.warning
  const style: CSSProperties = {
    ...base,
    ...(fontFamily && { fontFamily }),
    ...(fontStyle && { fontStyle }),
    ...styleOverride,
  }

  return (
    <div
      {...(inDialog
        ? { 'aria-live': 'polite' as const }
        : { role: 'status', 'aria-label': 'Country details' })}
      className={['rwme-details', className].filter(Boolean).join(' ')}
      style={style}
    >
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Hide details" style={styles.close}>
          Hide
        </button>
      )}
      {!selection && (
        <p style={styles.paragraph}>
          Click a country to see its details. Shift+click (or ⌘/Ctrl+click) to select up to{' '}
          {MAX_SELECTED_COUNTRIES} countries.
        </p>
      )}
      {selection && !content && <p style={styles.paragraph}>{missingMessage(selection)}</p>}
      {selection && content && (
        <>
          <Title className="rwme-details__title" style={styles.title}>
            {selection.detail?.name ?? selection.name}
          </Title>
          <SelectionBody content={selection} groupHeadingLevel={headingLevel + 1} />
        </>
      )}
    </div>
  )
}

/** Compact button that brings a hidden details card back. */
export const ShowDetailsButton = ({
  name,
  onClick,
  fontFamily,
  fontStyle,
}: {
  name: string
  onClick: () => void
  fontFamily?: string
  fontStyle?: CSSProperties['fontStyle']
}) => (
  <button
    type="button"
    className="rwme-details-toggle"
    aria-expanded={false}
    onClick={onClick}
    style={{
      ...styles.close,
      position: 'static',
      alignSelf: 'flex-start',
      padding: '0.35rem 0.8rem',
      fontSize: '0.9rem',
      ...(fontFamily && { fontFamily }),
      ...(fontStyle && { fontStyle }),
    }}
  >
    Show details: {name}
  </button>
)
