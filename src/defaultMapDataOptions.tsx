import React from 'react'

interface DefaultMapDataOptionsProps {
  selectedValue: string
  onChange: (value: string) => void
}

const Options = [
  { label: 'Country Name', value: 'CountryName' },
  { label: 'Country Name (with Capitals)', value: 'CountryNameWithCapitals' },
]

export const DefaultMapDataOptions = ({ selectedValue, onChange }: DefaultMapDataOptionsProps) => {
  return (
    <fieldset style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
      <legend>Select Map Data Option</legend>

      {Options.map((option) => {
        const { label, value } = option
        return (
          <div key={value}>
            <input
              type="radio"
              id={value}
              name={label}
              value={value}
              checked={selectedValue === value}
              onChange={(e) => {
                onChange(e.target.value)
              }}
            />
            <label htmlFor={Options[0].value}>{label}</label>
          </div>
        )
      })}
    </fieldset>
  )
}
