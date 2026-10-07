import { type RefObject, useEffect, useLayoutEffect } from 'react'

// useLayoutEffect warns during server rendering in React 18
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * SVG has no z-index: later siblings paint over earlier ones, so a highlighted border is
 * partly covered by the countries drawn after it. While `countryName` is set, move that
 * country's element to the end of its parent (drawn last, i.e. on top) and put it back afterwards.
 * Countries are matched by the `aria-label` that react-svg-worldmap puts on each path.
 */
export const useRaiseOnTop = (root: RefObject<HTMLElement | null>, countryName: string | undefined) => {
  useIsomorphicLayoutEffect(() => {
    if (!countryName || !root.current) return

    const path = Array.from(root.current.querySelectorAll('path')).find(
      (candidate) => candidate.getAttribute('aria-label') === countryName,
    )
    const parent = path?.parentNode
    if (!path || !parent) return

    // moving a node drops its focus, which would throw keyboard users out of the map
    const move = (place: () => void) => {
      const hadFocus = document.activeElement === path
      place()
      if (hadFocus) path.focus({ preventScroll: true })
    }

    const next = path.nextSibling
    move(() => parent.appendChild(path))
    return () => move(() => parent.insertBefore(path, next))
  }, [root, countryName])
}
