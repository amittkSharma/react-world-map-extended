import { fireEvent } from '@testing-library/react'

/** The map's `<path>` of a country, by the name it has on the map. */
export const country = (container: HTMLElement, name: string) =>
  container.querySelector(`path[aria-label="${name}"]`) as SVGPathElement

export const shiftClick = (element: Element) => fireEvent.click(element, { shiftKey: true })

/** The inline style of a country, as written on the element. */
export const styleOf = (container: HTMLElement, name: string) =>
  country(container, name).getAttribute('style') ?? ''
