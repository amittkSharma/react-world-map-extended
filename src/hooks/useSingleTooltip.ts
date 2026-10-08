import type { RefObject } from 'react'
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect'

/**
 * react-svg-worldmap gives every country both its own styled tooltip and a `<title>` child, which
 * the browser shows as a second, plain tooltip after a delay (same text). This removes the
 * `<title>` of every country whose name is in `styledTooltipNames`, i.e. that has the styled
 * tooltip, and keeps watching for countries the library adds later. Each country keeps its
 * `aria-label`, so its accessible name is unchanged.
 *
 * React keeps updating the detached `<title>` nodes it still holds, which is harmless: the library
 * never adds or removes that child on its own while the country exists.
 */
export const useSingleTooltip = (
  mapRef: RefObject<HTMLElement | null>,
  styledTooltipNames: ReadonlySet<string>,
) => {
  useIsomorphicLayoutEffect(() => {
    const root = mapRef.current
    if (!root) return

    const strip = () => {
      for (const title of Array.from(root.querySelectorAll('path > title'))) {
        const name = title.parentElement?.getAttribute('aria-label')
        if (name && styledTooltipNames.has(name)) title.remove()
      }
    }
    strip()

    // react-path-tooltip also adds and removes nodes while you hover: only react to new <path>/<title>
    const observer = new MutationObserver((records) => {
      const relevant = records.some((record) =>
        Array.from(record.addedNodes).some(
          (node) =>
            node.nodeName.toLowerCase() === 'title' ||
            (node instanceof Element && node.querySelector('title') !== null),
        ),
      )
      if (relevant) strip()
    })
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [mapRef, styledTooltipNames])
}
