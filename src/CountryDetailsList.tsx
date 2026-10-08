import { type CSSProperties, useEffect, useId, useRef, useState } from 'react'
import {
  DetailsBody,
  type HeadingLevel,
  detailsStyles,
  headingTag,
} from './CountryDetails'
import type { CountryDetail } from './rawData/getDefaultMapData'
import { MAX_SELECTED_COUNTRIES } from './selectionLimit'

/** The nearest ancestor that scrolls, e.g. a side card; the page itself is left alone. */
const scrollParent = (element: HTMLElement): HTMLElement | null => {
  for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    const { overflowY, overflow } = getComputedStyle(parent)
    const scrolls = [overflowY, overflow].some((value) => value === 'auto' || value === 'scroll')
    if (scrolls && parent.scrollHeight > parent.clientHeight) {
      return parent
    }
  }
  return null
}

/** Brings `element` into view inside the card that scrolls it (not the page: a click on the map must not move the page). */
const showInCard = (element: HTMLElement) => {
  const scroller = scrollParent(element)
  if (!scroller) return
  const item = element.getBoundingClientRect()
  const view = scroller.getBoundingClientRect()
  if (item.top < view.top) scroller.scrollTop -= view.top - item.top
  else if (item.bottom > view.bottom) scroller.scrollTop += item.bottom - view.bottom
}

export interface CountrySelection {
  /** ISO 3166-1 alpha-2 code, upper case. */
  code: string
  name: string
  /** `undefined` for areas without data (Northern Cyprus, Somaliland). */
  detail: CountryDetail | undefined
}

export interface CountryDetailsListProps {
  /** The selected countries, in the order they were selected. */
  selections: CountrySelection[]
  /** The limit shown in the "n of max" counter. Default 5. */
  max?: number
  /** Ask the list to open (and scroll to) one country, e.g. because it was clicked on the map.
   * Change `key` to ask again for the same country. */
  reveal?: { code: string; key: number } | null
  /** The country to mark, e.g. because the pointer is over it on the map. */
  highlightCode?: string | null
  /** Called with the country whose header the pointer or keyboard focus is on, or null. */
  onLink?: (code: string | null) => void
  /** When given, every header gets a remove button. */
  onRemove?: (code: string) => void
  /** When given, a "Clear all" button is shown. */
  onClear?: () => void
  /** When given, a "Hide" button is shown. */
  onClose?: () => void
  /** Level of the list's heading; each country's heading uses the next level, its categories the one after. Default 3. */
  headingLevel?: HeadingLevel
  fontFamily?: string
  fontStyle?: CSSProperties['fontStyle']
  className?: string
  style?: CSSProperties
  /** See `CountryDetails`: the list is the content of a dialog that already names it. */
  inDialog?: boolean
}

const itemStyles = {
  bar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '0.5rem',
    paddingRight: '5rem', // room for the Hide button
  },
  count: { color: 'var(--rwme-panel-muted, #59636e)', fontSize: '0.85rem' },
  button: {
    padding: '0.3rem 0.75rem',
    border: '1px solid var(--rwme-panel-border, #d0d7de)',
    borderRadius: 6,
    background: 'var(--rwme-panel-bg, #ffffff)',
    color: 'var(--rwme-panel-text, #1f2328)',
    fontFamily: 'inherit',
    fontStyle: 'inherit',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  list: { margin: '0.75rem 0 0', padding: 0, listStyle: 'none' },
  item: { borderTop: '1px solid var(--rwme-panel-border, #d0d7de)' },
  header: { display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 },
  toggle: {
    display: 'flex',
    flex: '1 1 auto',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 0.25rem',
    border: 'none',
    background: 'transparent',
    color: 'inherit',
    font: 'inherit',
    fontSize: '1.05rem',
    fontWeight: 600,
    textAlign: 'left',
    cursor: 'pointer',
  },
  chevron: { display: 'inline-block', width: '1em', transition: 'transform 0.15s' },
  remove: {
    flex: '0 0 auto',
    width: '1.9rem',
    height: '1.9rem',
    border: '1px solid transparent',
    borderRadius: 6,
    background: 'transparent',
    color: 'var(--rwme-panel-muted, #59636e)',
    fontSize: '1.1rem',
    lineHeight: 1,
    cursor: 'pointer',
  },
  panel: { padding: '0 0.25rem 0.75rem 1.5rem' },
} satisfies Record<string, CSSProperties>

/**
 * The details of two or more selected countries as an accordion: one header per country (its name),
 * opening to that country's details. A newly added country opens and the older ones close; you can
 * still open several by hand.
 */
export const CountryDetailsList = ({
  selections,
  max = MAX_SELECTED_COUNTRIES,
  reveal,
  highlightCode,
  onLink,
  onRemove,
  onClear,
  onClose,
  headingLevel = 3,
  fontFamily,
  fontStyle,
  className,
  style: styleOverride,
  inDialog = false,
}: CountryDetailsListProps) => {
  const baseId = useId()
  const codes = selections.map((selection) => selection.code)
  const key = codes.join(',')
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(codes.slice(-1)))
  const previous = useRef<string[]>(codes)
  const items = useRef(new Map<string, HTMLElement>())

  // Adding a country opens it and closes the older ones (the list would otherwise grow longer and
  // longer with every addition); removing one leaves the rest as they are
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` stands for `codes`
  useEffect(() => {
    const added = codes.filter((code) => !previous.current.includes(code))
    previous.current = codes
    setOpen((current) => {
      const next =
        added.length > 0
          ? new Set(added)
          : new Set([...current].filter((code) => codes.includes(code)))
      return next.size === current.size && [...next].every((code) => current.has(code))
        ? current
        : next
    })
  }, [key])

  // a country that was asked for opens and scrolls into view
  useEffect(() => {
    if (!reveal) return
    setOpen((current) => (current.has(reveal.code) ? current : new Set(current).add(reveal.code)))
    const item = items.current.get(reveal.code)
    if (item) requestAnimationFrame(() => showInCard(item)) // after the panel has opened and been laid out
  }, [reveal])

  const toggle = (code: string) =>
    setOpen((current) => {
      const next = new Set(current)
      if (!next.delete(code)) next.add(code)
      return next
    })

  const Title = headingTag(headingLevel)
  const ItemTitle = headingTag(headingLevel + 1)
  const style: CSSProperties = {
    ...detailsStyles.card,
    ...(fontFamily && { fontFamily }),
    ...(fontStyle && { fontStyle }),
    ...styleOverride,
  }

  return (
    <div
      {...(inDialog
        ? { 'aria-live': 'polite' as const }
        : { role: 'status', 'aria-label': 'Selected countries' })}
      className={['rwme-details', 'rwme-details--list', className].filter(Boolean).join(' ')}
      style={style}
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide details"
          style={detailsStyles.close}
        >
          Hide
        </button>
      )}
      <div style={itemStyles.bar}>
        <Title className="rwme-details__title" style={{ ...detailsStyles.title, paddingRight: 0 }}>
          Selected countries
        </Title>
        <span style={itemStyles.count}>
          {selections.length} of {max}
        </span>
        {onClear && (
          <button type="button" onClick={onClear} style={itemStyles.button}>
            Clear all
          </button>
        )}
      </div>

      <ul style={itemStyles.list}>
        {selections.map(({ code, name, detail }) => {
          const isOpen = open.has(code)
          const buttonId = `${baseId}-${code}-button`
          const panelId = `${baseId}-${code}-panel`
          return (
            <li
              key={code}
              className="rwme-details__item"
              data-code={code}
              ref={(element) => {
                if (element) items.current.set(code, element)
                else items.current.delete(code)
              }}
              style={{
                ...itemStyles.item,
                ...(highlightCode === code && {
                  background: 'var(--rwme-panel-highlight, #eef4ff)',
                }),
              }}
            >
              <ItemTitle style={itemStyles.header}>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(code)}
                  onMouseEnter={() => onLink?.(code)}
                  onMouseLeave={() => onLink?.(null)}
                  onFocus={() => onLink?.(code)}
                  onBlur={() => onLink?.(null)}
                  style={itemStyles.toggle}
                >
                  <span
                    aria-hidden="true"
                    style={{ ...itemStyles.chevron, transform: isOpen ? 'rotate(90deg)' : 'none' }}
                  >
                    ▸
                  </span>
                  {detail?.name ?? name}
                </button>
                {onRemove && (
                  <button
                    type="button"
                    aria-label={`Remove ${name} from the selection`}
                    onClick={() => onRemove(code)}
                    style={itemStyles.remove}
                  >
                    ×
                  </button>
                )}
              </ItemTitle>
              <section id={panelId} aria-labelledby={buttonId} hidden={!isOpen} style={itemStyles.panel}>
                {detail ? (
                  <DetailsBody
                    name={detail.name ?? name}
                    detail={detail}
                    groupHeadingLevel={headingLevel + 2}
                  />
                ) : (
                  <p style={detailsStyles.paragraph}>No details available for {name}.</p>
                )}
              </section>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
