interface PropertySelectProps {
  properties: readonly string[]
  /** The property that colours the map; the first one when it is not one of `properties`. */
  value: string | undefined
  onChange: (name: string) => void
}

/** Which property of your own data colours the map. */
export const PropertySelect = ({ properties, value, onChange }: PropertySelectProps) => (
  <fieldset>
    <legend>Show on map</legend>
    <select
      aria-label="Show on map"
      value={value !== undefined && properties.includes(value) ? value : properties[0]}
      onChange={(event) => onChange(event.target.value)}
    >
      {properties.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  </fieldset>
)
