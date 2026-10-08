import { type KeyboardEvent, type RefObject, useEffect, useRef } from 'react'

export type DeselectMode = 'outside' | 'background' | 'never'

interface DeselectOptions {
  /** The component's root, to tell clicks inside it from clicks outside. */
  rootRef: RefObject<HTMLElement | null>
  mapRef: RefObject<HTMLElement | null>
  mode: DeselectMode
  /** The overlay card is open: nothing clears the selection until it is closed. */
  overlayActive: boolean
  selectedCodes: readonly string[]
  /** Map names of the selected countries, to return keyboard focus to a country. */
  selectedNames: readonly string[]
  clear: () => void
}

/**
 * The ways to go back to the map's original look.
 *
 * A click that is not on a country, the controls or the card clears a selection of one country; a
 * larger selection is not cleared this way (one stray click would throw it away). Escape with focus
 * on the map or the card clears any selection. Returns the `onKeyDown` handler for the layout; the
 * overlay dialog handles its own Escape and stops it before it gets there.
 */
export const useDeselect = ({
  rootRef,
  mapRef,
  mode,
  overlayActive,
  selectedCodes,
  selectedNames,
  clear,
}: DeselectOptions) => {
  const clearRef = useRef(clear)
  clearRef.current = clear
  const single = selectedCodes.length === 1

  useEffect(() => {
    if (mode === 'never' || overlayActive || !single) return

    const onDocumentClick = (event: MouseEvent) => {
      const root = rootRef.current
      const target = event.target as Element | null
      // a handler of this very click may have removed its target (e.g. the Hide button)
      if (!root || !target?.isConnected) return
      const inside = root.contains(target)
      if (inside && target.closest('path')) return // a country: its own click handler decides
      // controls and details card, including a <WorldMapControls> placed elsewhere on the page
      if (target.closest('[data-rwme-keep]')) return
      if (!inside && mode === 'background') return
      clearRef.current()
    }

    document.addEventListener('click', onDocumentClick)
    return () => document.removeEventListener('click', onDocumentClick)
  }, [rootRef, mode, overlayActive, single])

  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return
    if (mode === 'never' || selectedCodes.length === 0) return
    const fromCard = (event.target as Element).closest('[data-rwme-keep]') !== null
    clear()
    if (fromCard) {
      // the card's content changes; keep keyboard users in the map, on a country they cleared
      Array.from(mapRef.current?.querySelectorAll('path') ?? [])
        .find((path) => path.getAttribute('aria-label') === selectedNames[0])
        ?.focus({ preventScroll: true })
    }
  }
}
