import { type RefObject, useState } from 'react'
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect'

/** Gap between the map and a details card placed beside / above / below it, in px. */
export const LAYOUT_GAP = 16

export interface MapBox {
  /** The map's <svg> relative to the layout container, in px (for what sits beside it: the card slot). */
  left: number
  top: number
  width: number
  height: number
  /** The same <svg>, relative to the map's own positioned wrapper (for what is drawn over it: the
   * legend and the overlay). These differ from `left`/`top` whenever a card sits above or beside
   * the map and pushes the wrapper away from the layout's origin. */
  inMap: { left: number; top: number }
  /** Width of the layout container, in px: the room the component has. */
  layoutWidth: number
}

const sameBox = (a: MapBox, b: MapBox) =>
  a.left === b.left &&
  a.top === b.top &&
  a.width === b.width &&
  a.height === b.height &&
  a.layoutWidth === b.layoutWidth &&
  a.inMap.left === b.inMap.left &&
  a.inMap.top === b.inMap.top

/**
 * Measures where the map's <svg> really is, so the details card can line up with it whatever
 * margins or caption `react-svg-worldmap` and the host page's CSS put around it.
 * Also removes the browser's default `<figure>` margin (40px at the sides), which the library
 * does not account for when it sizes the map to its container and which pushes the map into
 * a neighbouring card.
 */
export const useMapBox = (
  layoutRef: RefObject<HTMLElement | null>,
  mapRef: RefObject<HTMLElement | null>,
  enabled: boolean,
): MapBox | null => {
  const [box, setBox] = useState<MapBox | null>(null)

  useIsomorphicLayoutEffect(() => {
    const layout = layoutRef.current
    const map = mapRef.current
    const svg = map?.querySelector('svg')
    if (!enabled || !layout || !map || !svg) {
      setBox(null)
      return
    }
    const figure = svg.closest('figure')
    if (figure) figure.style.margin = '0'

    const measure = () => {
      const layoutRect = layout.getBoundingClientRect()
      const svgRect = svg.getBoundingClientRect()
      // not laid out (hidden, or no layout engine): no measurement is better than a 0px card
      if (svgRect.width === 0 || svgRect.height === 0) {
        setBox(null)
        return
      }
      const wrapperRect = (map.parentElement ?? layout).getBoundingClientRect()
      const next: MapBox = {
        left: Math.round(svgRect.left - layoutRect.left),
        top: Math.round(svgRect.top - layoutRect.top),
        width: Math.round(svgRect.width),
        height: Math.round(svgRect.height),
        inMap: {
          left: Math.round(svgRect.left - wrapperRect.left),
          top: Math.round(svgRect.top - wrapperRect.top),
        },
        layoutWidth: Math.round(layoutRect.width),
      }
      setBox((previous) => (previous && sameBox(previous, next) ? previous : next))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(svg)
    observer.observe(layout)
    if (map.parentElement) observer.observe(map.parentElement)
    return () => observer.disconnect()
  }, [layoutRef, mapRef, enabled])

  return box
}
