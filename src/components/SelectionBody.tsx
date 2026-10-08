import type { SelectionContent } from '../lib/cardSelections'
import type { CountryDataValue, CountryDataValues } from '../lib/countryData'
import type { CountryDetail } from '../lib/countryDetail'
import { headingTag } from '../lib/headings'
import { continentNames } from '../lib/palettes'
import { parseWebUrl } from '../lib/webUrl'
import { detailsStyles as styles } from '../styles/detailsStyles'

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

const displayValue = (value: CountryDataValue) => (value === null ? '—' : String(value))

interface BodyProps {
  /** Level of the headings of the categories. */
  groupHeadingLevel: number
}

/** Your own values, labelled exactly as their property names (`infoLink` is not a value: it is the link). */
const CustomValues = ({ values, groupHeadingLevel }: BodyProps & { values: CountryDataValues }) => {
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

const MoreInformation = ({ name, url }: { name: string; url: URL }) => {
  const host = url.hostname.replace(/^www\./, '')
  return (
    <p className="rwme-details__link" style={styles.footer}>
      More information:{' '}
      <a
        href={url.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`More information about ${name} on ${host} (opens in a new tab)`}
        style={styles.link}
      >
        {host} ↗
      </a>
    </p>
  )
}

/** The grouped facts of one country and its `infoLink`, without a title (the caller supplies it). */
const DetailsBody = ({
  name,
  detail,
  groupHeadingLevel,
}: BodyProps & { name: string; detail: CountryDetail }) => {
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      fields: group.fields.filter((field) => detail[field] !== undefined && detail[field] !== ''),
    }))
    .filter((group) => group.fields.length > 0)
  const infoUrl = parseWebUrl(detail.infoLink)
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
      {infoUrl && <MoreInformation name={name} url={infoUrl} />}
    </>
  )
}

/** The body of a country's card for any source (the caller supplies the title). */
export const SelectionBody = ({
  content,
  groupHeadingLevel,
}: BodyProps & { content: SelectionContent }) => {
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
