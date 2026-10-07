import { type RefObject, useEffect, useLayoutEffect, useState } from 'react'

// useEffect on the server: React 18 warns about layout effects there
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/** Gap between the map and a details card placed beside / above / below it, in px. */
export const LAYOUT_GAP = 16

export interface MapBox {
  /** The map's <svg> relative to the layout container, in px. */
  left: number
  top: number
  width: number
  height: number
}

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

  useIsoLayoutEffect(() => {
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
      const next: MapBox = {
        left: Math.round(svgRect.left - layoutRect.left),
        top: Math.round(svgRect.top - layoutRect.top),
        width: Math.round(svgRect.width),
        height: Math.round(svgRect.height),
      }
      setBox((previous) =>
        previous &&
        previous.left === next.left &&
        previous.top === next.top &&
        previous.width === next.width &&
        previous.height === next.height
          ? previous
          : next,
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(svg)
    observer.observe(layout)
    return () => observer.disconnect()
  }, [layoutRef, mapRef, enabled])

  return box
}
