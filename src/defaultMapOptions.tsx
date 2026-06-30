import React from 'react'

interface DefaultMapOptionsProps {
  selectedValue: string
  onChange: (value: string) => void
}

export const DefaultMapOptions = ({ selectedValue, onChange }: DefaultMapOptionsProps) => {
  return (
    <fieldset style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
      <legend>Select Map Option</legend>

      <div>
        <input
          type="radio"
          id="BlackAndWhite"
          name="mapOptions"
          value="BlackAndWhite"
          checked={selectedValue === 'BlackAndWhite'}
          onChange={(e) => {
            onChange(e.target.value)
          }}
        />
        <label htmlFor="BlackAndWhite">Black & White</label>
      </div>

      <div>
        <input
          type="radio"
          id="Color"
          name="mapOptions"
          value="Color"
          onChange={(e) => {
            onChange(e.target.value)
          }}
          checked={selectedValue === 'Color'}
        />
        <label htmlFor="Color">Color</label>
      </div>
    </fieldset>
  )
}
