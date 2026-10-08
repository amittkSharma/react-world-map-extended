/** The nearest ancestor that scrolls, e.g. a side card; the page itself is left alone. */
const scrollParent = (element: HTMLElement): HTMLElement | null => {
  for (
    let parent = element.parentElement;
    parent && parent !== document.body;
    parent = parent.parentElement
  ) {
    const { overflowY, overflow } = getComputedStyle(parent)
    const scrolls = [overflowY, overflow].some((value) => value === 'auto' || value === 'scroll')
    if (scrolls && parent.scrollHeight > parent.clientHeight) return parent
  }
  return null
}

/**
 * Brings `element` into view inside the card that scrolls it, never the page: a click on the map
 * must not move the page.
 */
export const scrollIntoCard = (element: HTMLElement) => {
  const scroller = scrollParent(element)
  if (!scroller) return
  const item = element.getBoundingClientRect()
  const view = scroller.getBoundingClientRect()
  if (item.top < view.top) scroller.scrollTop -= view.top - item.top
  else if (item.bottom > view.bottom) scroller.scrollTop += item.bottom - view.bottom
}
