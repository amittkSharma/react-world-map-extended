import type { LabelValue } from './types'

interface UserOptionsProps<T extends string> {
  legend: string
  /** Radio group name; must be unique per group on the page (see useId in the caller). */
  name: string
  sources: Array<LabelValue<T>>
  selectedValue: T
  onChange: (value: T) => void
}

export const UserOptions = <T extends string>({
  legend,
  name,
  sources,
  selectedValue,
  onChange,
}: UserOptionsProps<T>) => {
  return (
    <fieldset style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
      <legend>{legend}</legend>

      {sources.map(({ label, value }) => (
        <label key={value}>
          <input
            type="radio"
            name={name}
            value={value}
            checked={selectedValue === value}
            onChange={() => onChange(value)}
          />
          {label}
        </label>
      ))}
    </fieldset>
  )
}
