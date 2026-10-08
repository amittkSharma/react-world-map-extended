import { hasContent, missingMessage, type SelectionContent } from '../lib/cardSelections'
import { headingTag } from '../lib/headings'
import { MAX_SELECTED_COUNTRIES } from '../lib/selectionLimit'
import { detailsStyles as styles } from '../styles/detailsStyles'
import type { CardAppearance } from '../types'
import { DetailsShell } from './DetailsShell'
import { SelectionBody } from './SelectionBody'

export interface CountryDetailsProps extends CardAppearance {
  /** The country to show; `null` shows a hint to click a country. `detail` is `undefined` for areas without data. */
  selection: SelectionContent | null
  /** When given, a "Hide" button is shown and calls this. */
  onClose?: () => void
  /** Set when the card is the content of a dialog that already names and announces it: the card then
   * is a plain polite live area instead of a second, separately named `status` region. */
  inDialog?: boolean
}

/** Live region (screen readers announce updates) showing the selected country's details. */
export const CountryDetails = ({
  selection,
  headingLevel = 3,
  inDialog = false,
  ...shell
}: CountryDetailsProps) => {
  const content = selection ? hasContent(selection) : false
  const Title = headingTag(headingLevel)
  const look = !selection ? styles.empty : content ? styles.card : styles.warning

  return (
    <DetailsShell {...shell} label="Country details" look={look} inDialog={inDialog}>
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
    </DetailsShell>
  )
}
