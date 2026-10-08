import { type RefObject, useEffect, useRef } from 'react'
import { useIsomorphicLayoutEffect } from './useIsomorphicLayoutEffect'

/** Marks `ref`'s element `inert` while `active`: no pointer, keyboard or screen-reader access. */
export const useInert = (ref: RefObject<HTMLElement | null>, active: boolean) => {
  useIsomorphicLayoutEffect(() => {
    const element = ref.current
    if (!active || !element) return
    element.setAttribute('inert', '')
    return () => element.removeAttribute('inert')
  }, [ref, active])
}

/**
 * Modal behaviour for `dialogRef` while `active`: focus moves into it, Tab stays inside, Escape
 * calls `onClose`, and focus returns to where it was when it closes.
 */
export const useModalDialog = (
  dialogRef: RefObject<HTMLElement | null>,
  active: boolean,
  onClose: () => void,
) => {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const dialog = dialogRef.current
    if (!active || !dialog) return

    const previous = document.activeElement as HTMLElement | null
    dialog.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement
      if (event.shiftKey && (current === first || current === dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && current === last) {
        event.preventDefault()
        first.focus()
      }
    }

    dialog.addEventListener('keydown', onKeyDown)
    return () => {
      dialog.removeEventListener('keydown', onKeyDown)
      // after the commit, so the map is no longer inert when focus returns to it
      queueMicrotask(() => previous?.focus?.())
    }
  }, [dialogRef, active])
}
