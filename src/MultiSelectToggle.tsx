import { type Corner, type CornerBox, placeInCorner } from './corner'

interface MultiSelectToggleProps {
  on: boolean
  onToggle: () => void
  corner: Corner
  box: CornerBox | null
}

/** For devices without a Shift key: while on, a plain click adds or removes a country. */
export const MultiSelectToggle = ({ on, onToggle, corner, box }: MultiSelectToggleProps) => (
  <button
    type="button"
    data-rwme-keep // pressing it is not a click away from the selection
    className="rwme-multiselect-toggle"
    aria-pressed={on}
    onClick={onToggle}
    style={{
      ...placeInCorner(corner, box),
      zIndex: 5,
      padding: '0.35rem 0.7rem',
      border: '1px solid var(--rwme-panel-border, #d0d7de)',
      borderRadius: 999,
      background: on ? 'var(--rwme-panel-accent, #0969da)' : 'var(--rwme-legend-bg, rgba(255, 255, 255, 0.92))',
      color: on ? '#ffffff' : 'var(--rwme-panel-text, #1f2328)',
      font: 'inherit',
      fontSize: '0.8rem',
      cursor: 'pointer',
    }}
  >
    {on ? 'Select multiple: on' : 'Select multiple'}
  </button>
)
