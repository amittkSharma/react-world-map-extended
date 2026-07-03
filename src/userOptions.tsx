import React from 'react'
import { LabelValue } from './types'

interface DefaultMapDataOptionsProps {
  sources: Array<LabelValue>
  selectedValue: string
  onChange: (value: string) => void
}

export const UserOptions = ({ sources, selectedValue, onChange }: DefaultMapDataOptionsProps) => {
  return (
    <fieldset style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
      <legend>Select Map Data Option</legend>

      {sources.map((source) => {
        const { label, value } = source
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
            <label htmlFor={sources[0].value}>{label}</label>
          </div>
        )
      })}
    </fieldset>
  )
}
