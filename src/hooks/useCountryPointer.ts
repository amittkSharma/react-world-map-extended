import { type FocusEvent, type MouseEvent, useState } from 'react'
import { countryCodes } from '../lib/countries'
import { usedKeyboardLast } from '../lib/inputModality'

/** The name a country has on the map, from an event on one of its paths. */
const countryCodeOf = (event: { target: EventTarget }) => {
  const name = (event.target as Element).closest('path')?.getAttribute('aria-label')
  return name ? countryCodes.get(name) : undefined
}

/**
 * Which country has keyboard focus (not mouse focus, which needs no ring) and which selected country
 * the pointer is over, with the handlers for the element around the map that report both.
 */
export const useCountryPointer = (selectedCodes: readonly string[]) => {
  const [focusedCode, setFocusedCode] = useState<string | null>(null)
  const [hoveredCode, setHoveredCode] = useState<string | null>(null)

  return {
    focusedCode,
    hoveredCode,
    handlers: {
      onFocus: (event: FocusEvent) =>
        setFocusedCode((usedKeyboardLast() && countryCodeOf(event)) || null),
      onBlur: () => setFocusedCode(null),
      onMouseOver: (event: MouseEvent) => {
        const code = countryCodeOf(event)
        setHoveredCode(code && selectedCodes.includes(code) ? code : null)
      },
      onMouseOut: () => setHoveredCode(null),
    },
  }
}
