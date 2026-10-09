import { useId } from 'react'
import { type RevealRequest, useAccordion } from '../hooks/useAccordion'
import type { CountrySelection } from '../lib/cardSelections'
import { classNames } from '../lib/classNames'
import { MAX_SELECTED_COUNTRIES, selectionCount } from '../lib/selectionLimit'
import { detailsStyles, listStyles } from '../styles/detailsStyles'
import type { CardAppearance } from '../types'
import { DetailsListItem } from './DetailsListItem'
import { DetailsShell } from './DetailsShell'
import { SelectionBar } from './SelectionBar'

export interface CountryDetailsListProps extends CardAppearance {
  /** The selected countries, in the order they were selected. */
  selections: CountrySelection[]
  /** The limit shown in the "n of max" counter (`Infinity`: "n selected"). Default 5. */
  max?: number
  /** Ask the list to open (and scroll to) one country, e.g. because it was clicked on the map.
   * Change `key` to ask again for the same country. */
  reveal?: RevealRequest | null
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
  /** See `CountryDetails`: the list is the content of a dialog that already names it. */
  inDialog?: boolean
}

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
  headingLevel = 3,
  className,
  inDialog = false,
  ...shell
}: CountryDetailsListProps) => {
  const baseId = useId()
  const accordion = useAccordion(
    selections.map(({ code }) => code),
    reveal,
  )

  return (
    <DetailsShell
      {...shell}
      label="Selected countries"
      className={classNames('rwme-details--list', className)}
      look={detailsStyles.card}
      inDialog={inDialog}
    >
      <SelectionBar
        headingLevel={headingLevel}
        count={selectionCount(selections.length, max)}
        onClear={onClear}
      />
      <ul style={listStyles.list}>
        {selections.map((selection) => (
          <DetailsListItem
            key={selection.code}
            selection={selection}
            ids={{
              button: `${baseId}-${selection.code}-button`,
              panel: `${baseId}-${selection.code}-panel`,
            }}
            open={accordion.isOpen(selection.code)}
            highlighted={highlightCode === selection.code}
            headingLevel={headingLevel + 1}
            onToggle={() => accordion.toggle(selection.code)}
            onLink={onLink}
            onRemove={onRemove}
            itemRef={accordion.itemRef(selection.code)}
          />
        ))}
      </ul>
    </DetailsShell>
  )
}
