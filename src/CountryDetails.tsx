import type { CSSProperties } from 'react'
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
  boxSizing: 'border-box',
  maxWidth: '56rem',
  margin: '1rem 2.5em',
  padding: '1rem 1.25rem',
  borderRadius: 8,
  border: '1px solid var(--rwme-panel-border, #d0d7de)',
  borderLeft: '4px solid var(--rwme-panel-accent, #0969da)',
  background: 'var(--rwme-panel-bg, #ffffff)',
  color: 'var(--rwme-panel-text, #1f2328)',
  fontSize: '0.95rem',
  lineHeight: 1.4,
}

const styles = {
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
  title: { margin: 0, fontSize: '1.4rem', fontWeight: 650, lineHeight: 1.2 },
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
} satisfies Record<string, CSSProperties>

/** `infoLink` may come from consumer code: only ever render http(s) URLs (never e.g. `javascript:`). */
const parseWebUrl = (value: string | undefined): URL | undefined => {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : undefined
  } catch {
    return undefined
  }
}

interface CountryDetailsProps {
  selection: { name: string; detail: CountryDetail | undefined } | null
}

/** Live region (screen readers announce updates) showing the selected country's details. */
export const CountryDetails = ({ selection }: CountryDetailsProps) => {
  const detail = selection?.detail
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      fields: group.fields.filter((field) => detail?.[field] !== undefined && detail[field] !== ''),
    }))
    .filter((group) => group.fields.length > 0)

  const infoUrl = parseWebUrl(detail?.infoLink)
  const host = infoUrl?.hostname.replace(/^www\./, '')

  const style = !selection ? styles.empty : detail ? styles.card : styles.warning

  return (
    <div role="status" aria-label="Country details" className="rwme-details" style={style}>
      {!selection && <p style={styles.paragraph}>Click a country to see its details.</p>}
      {selection && !detail && (
        <p style={styles.paragraph}>No details available for {selection.name}.</p>
      )}
      {selection && detail && (
        <>
          <h3 className="rwme-details__title" style={styles.title}>
            {detail.name ?? selection.name}
          </h3>
          {visibleGroups.length > 0 && (
            <div style={styles.grid}>
              {visibleGroups.map((group) => (
                <div key={group.title}>
                  <h4 style={styles.groupTitle}>{group.title}</h4>
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
                aria-label={`More information about ${detail.name ?? selection.name} on ${host} (opens in a new tab)`}
                style={styles.link}
              >
                {host} ↗
              </a>
            </p>
          )}
        </>
      )}
    </div>
  )
}
