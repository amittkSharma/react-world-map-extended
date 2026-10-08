import { type CountrySelection, hasContent, missingMessage } from '../lib/cardSelections'
import { headingTag } from '../lib/headings'
import { detailsStyles, listStyles } from '../styles/detailsStyles'
import { SelectionBody } from './SelectionBody'

interface DetailsListItemProps {
  selection: CountrySelection
  /** The element ids of the header button and its panel. */
  ids: { button: string; panel: string }
  open: boolean
  highlighted: boolean
  /** Level of this entry's heading; its categories use the next level. */
  headingLevel: number
  onToggle: () => void
  onLink?: (code: string | null) => void
  onRemove?: (code: string) => void
  itemRef: (element: HTMLElement | null) => void
}

/** One country of the list: a header that opens and closes its details. */
export const DetailsListItem = ({
  selection,
  ids,
  open,
  highlighted,
  headingLevel,
  onToggle,
  onLink,
  onRemove,
  itemRef,
}: DetailsListItemProps) => {
  const { code, name, detail } = selection
  const ItemTitle = headingTag(headingLevel)

  return (
    <li
      className="rwme-details__item"
      data-code={code}
      ref={itemRef}
      style={{
        ...listStyles.item,
        ...(highlighted && { background: 'var(--rwme-panel-highlight, #eef4ff)' }),
      }}
    >
      <ItemTitle style={listStyles.header}>
        <button
          type="button"
          id={ids.button}
          aria-expanded={open}
          aria-controls={ids.panel}
          onClick={onToggle}
          onMouseEnter={() => onLink?.(code)}
          onMouseLeave={() => onLink?.(null)}
          onFocus={() => onLink?.(code)}
          onBlur={() => onLink?.(null)}
          style={listStyles.toggle}
        >
          <span
            aria-hidden="true"
            style={{ ...listStyles.chevron, transform: open ? 'rotate(90deg)' : 'none' }}
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
            style={listStyles.remove}
          >
            ×
          </button>
        )}
      </ItemTitle>
      <section id={ids.panel} aria-labelledby={ids.button} hidden={!open} style={listStyles.panel}>
        {hasContent(selection) ? (
          <SelectionBody content={selection} groupHeadingLevel={headingLevel + 1} />
        ) : (
          <p style={detailsStyles.paragraph}>{missingMessage(selection)}</p>
        )}
      </section>
    </li>
  )
}
