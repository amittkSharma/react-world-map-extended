import { type RefObject, useEffect, useLayoutEffect } from 'react'

// useLayoutEffect warns during server rendering in React 18
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * SVG has no z-index: later siblings paint over earlier ones, so a highlighted border is
 * partly covered by the countries drawn after it. While `countryNames` is not empty, move those
 * countries' elements to the end of their parent (drawn last, i.e. on top, in the given order) and
 * put them back afterwards. Countries are matched by the `aria-label` that react-svg-worldmap puts
 * on each path.
 */
export const useRaiseOnTop = (root: RefObject<HTMLElement | null>, countryNames: string[]) => {
  const key = countryNames.join('\u0000') // a new array with the same names must not re-run this

  useIsomorphicLayoutEffect(() => {
    if (key === '' || !root.current) return

    const paths = Array.from(root.current.querySelectorAll('path'))
    const moved: Array<{ path: SVGPathElement; parent: ParentNode; next: ChildNode | null }> = []

    // moving a node drops its focus, which would throw keyboard users out of the map
    const move = (path: SVGPathElement, place: () => void) => {
      const hadFocus = document.activeElement === path
      place()
      if (hadFocus) path.focus({ preventScroll: true })
    }

    for (const name of key.split('\u0000')) {
      const path = paths.find((candidate) => candidate.getAttribute('aria-label') === name)
      const parent = path?.parentNode
      if (!path || !parent) continue
      moved.push({ path, parent, next: path.nextSibling })
      move(path, () => parent.appendChild(path))
    }

    // back in reverse order, so every recorded neighbour is already where it belongs
    return () => {
      for (const { path, parent, next } of moved.reverse()) {
        move(path, () => parent.insertBefore(path, next))
      }
    }
  }, [root, key])
}
