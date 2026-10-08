import { useCallback, useEffect, useRef, useState } from 'react'
import { scrollIntoCard } from '../lib/scrollIntoCard'

export interface RevealRequest {
  code: string
  /** Change it to ask again for the same country. */
  key: number
}

const sameMembers = (a: ReadonlySet<string>, b: ReadonlySet<string>) =>
  a.size === b.size && [...a].every((code) => b.has(code))

/**
 * Which entries of the list are open. Adding a country opens it and closes the older ones (the list
 * would otherwise grow longer with every addition); removing one leaves the rest as they are. A
 * `reveal` request opens an entry and scrolls it into view inside the card.
 */
export const useAccordion = (
  codes: readonly string[],
  reveal: RevealRequest | null | undefined,
) => {
  const key = codes.join(',')
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(codes.slice(-1)))
  const known = useRef<string[]>([...codes])
  const items = useRef(new Map<string, HTMLElement>())

  useEffect(() => {
    const current = key === '' ? [] : key.split(',')
    const added = current.filter((code) => !known.current.includes(code))
    known.current = current
    setOpen((previous) => {
      const next =
        added.length > 0
          ? new Set(added)
          : new Set([...previous].filter((code) => current.includes(code)))
      return sameMembers(next, previous) ? previous : next
    })
  }, [key])

  useEffect(() => {
    if (!reveal) return
    setOpen((previous) =>
      previous.has(reveal.code) ? previous : new Set(previous).add(reveal.code),
    )
    const item = items.current.get(reveal.code)
    if (item) requestAnimationFrame(() => scrollIntoCard(item)) // after the panel has opened and been laid out
  }, [reveal])

  const toggle = useCallback(
    (code: string) =>
      setOpen((previous) => {
        const next = new Set(previous)
        if (!next.delete(code)) next.add(code)
        return next
      }),
    [],
  )

  /** A ref callback that remembers the element of an entry, to scroll to it. */
  const itemRef = (code: string) => (element: HTMLElement | null) => {
    if (element) items.current.set(code, element)
    else items.current.delete(code)
  }

  return { isOpen: (code: string) => open.has(code), toggle, itemRef }
}
