import { useCallback, useEffect, useRef, useState } from 'react'
import { countryNames } from '../lib/countries'
import { MAX_SELECTED_COUNTRIES, selectionCount } from '../lib/selectionLimit'
import { useControllableState } from './useControllableState'

/** Upper-cases codes, drops unknown ones and duplicates, keeps the first `max` and counts the rest. */
const normalizeCodes = (input: readonly string[], max: number) => {
  const unique: string[] = []
  for (const raw of input) {
    const code = raw.toUpperCase()
    if (countryNames.has(code) && !unique.includes(code)) unique.push(code)
  }
  return { codes: unique.slice(0, max), overflow: Math.max(0, unique.length - max) }
}

const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((code, index) => code === b[index])

const nameOf = (code: string) => countryNames.get(code) ?? code

/** "3 of 5 selected" with a limit, "3 selected" without one. */
const status = (count: number, max: number) =>
  `${selectionCount(count, max)}${Number.isFinite(max) ? ' selected' : ''}`

const removedMessage = (code: string, remaining: number, max: number) =>
  `${nameOf(code)} removed, ${remaining === 0 ? 'nothing selected' : status(remaining, max)}`

interface Options {
  /** The most countries that can be selected (`Infinity` for no limit). Default 5. */
  max?: number
  /** Controlled when set (an empty array = nothing selected). */
  selectedCountries?: readonly string[]
  defaultSelectedCountries?: readonly string[]
  onSelectionChange?: (countryCodes: string[]) => void
}

/**
 * The selected countries (at most `max`, in the order they were selected) and everything that changes
 * them: a click (replace / add / remove / pop up), removing one, clearing all. Also owns the messages
 * that go with it: a toast when the limit is hit or a controlled array is too long, and a line for
 * screen readers. A blocked click never reaches `onSelectionChange`, and a controlled array is never
 * written back.
 */
export const useCountrySelection = ({
  max = MAX_SELECTED_COUNTRIES,
  selectedCountries,
  defaultSelectedCountries,
  onSelectionChange,
}: Options) => {
  const controlled = selectedCountries ? normalizeCodes(selectedCountries, max) : undefined
  const [codes, setCodes] = useControllableState<string[]>(
    controlled?.codes,
    normalizeCodes(defaultSelectedCountries ?? [], max).codes,
    onSelectionChange,
  )
  const codesRef = useRef(codes)
  codesRef.current = codes

  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [reveal, setReveal] = useState<{ code: string; key: number } | null>(null)
  const counter = useRef(0)

  const showToast = useCallback((text: string) => setToast({ id: ++counter.current, text }), [])
  const dismissToast = useCallback(() => setToast(null), [])

  // a controlled array that is too long: the first `max` are used and the user is told
  const tooLong =
    controlled && controlled.overflow > 0
      ? `Only the first ${max} of ${controlled.codes.length + controlled.overflow} selected countries are shown.`
      : ''
  useEffect(() => {
    if (tooLong) showToast(tooLong)
  }, [tooLong, showToast])

  const revealCode = useCallback(
    (code: string) => setReveal((current) => ({ code, key: (current?.key ?? 0) + 1 })),
    [],
  )

  const commit = (next: string[], message: string) => {
    if (!same(next, codesRef.current)) {
      // several clicks can arrive before the next render: the next one must build on this one
      // (the render puts the real value back, so a controlled parent that refuses still wins)
      codesRef.current = next
      setCodes(next)
    }
    setAnnouncement(message)
  }

  const removeFrom = (current: string[], code: string) => {
    const next = current.filter((candidate) => candidate !== code)
    commit(next, removedMessage(code, next.length, max))
  }

  /**
   * A click (or Enter) on a country. `toggle` (Shift / Cmd / Ctrl held, or the multi-select switch is
   * on) adds or removes it; otherwise it replaces the selection, except that a country that is
   * already part of a larger selection is only popped up in the details.
   */
  const click = (code: string, toggle: boolean) => {
    const current = codesRef.current
    const included = current.includes(code)
    if (toggle) {
      if (included) {
        removeFrom(current, code)
      } else if (current.length >= max) {
        showToast(`You can select up to ${max} countries. Deselect one to add another.`) // the toast is a status region: it is read out by itself
      } else {
        commit([...current, code], `${nameOf(code)} added, ${status(current.length + 1, max)}`)
        revealCode(code)
      }
    } else if (included) {
      if (current.length > 1) revealCode(code)
    } else {
      commit([code], `${nameOf(code)} selected`)
      revealCode(code)
    }
  }

  const remove = (code: string) => removeFrom(codesRef.current, code)

  const clear = () => {
    if (codesRef.current.length === 0) return
    commit([], 'Selection cleared')
  }

  return { codes, max, click, remove, clear, reveal, announcement, toast, dismissToast }
}
