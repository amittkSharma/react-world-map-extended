import { headingTag } from '../lib/headings'
import { detailsStyles, listStyles } from '../styles/detailsStyles'

interface SelectionBarProps {
  headingLevel: number
  /** "2 of 5", see `selectionCount`. */
  count: string
  /** When given, a "Clear all" button is shown. */
  onClear?: () => void
}

/** The head of a card with several countries: its title, how many are selected and "Clear all". */
export const SelectionBar = ({ headingLevel, count, onClear }: SelectionBarProps) => {
  const Title = headingTag(headingLevel)
  return (
    <div style={listStyles.bar}>
      <Title className="rwme-details__title" style={{ ...detailsStyles.title, paddingRight: 0 }}>
        Selected countries
      </Title>
      <span style={listStyles.count}>{count}</span>
      {onClear && (
        <button type="button" onClick={onClear} style={listStyles.button}>
          Clear all
        </button>
      )}
    </div>
  )
}
