/**
 * Whether the user last used the keyboard or a pointer, tracked once for the whole page (like the
 * `:focus-visible` heuristic, but also for focus this package moves itself).
 *
 * The browser's own focus ring is not an option for the countries: it is a rectangle around the
 * path's bounding box (huge for Russia), and browsers also draw it after a mouse click when the
 * focus is moved by script, which this package does when it redraws the selected country.
 */
let modality: 'keyboard' | 'pointer' = 'pointer'
let tracking = false

const toPointer = () => {
  modality = 'pointer'
}

const toKeyboard = (event: KeyboardEvent) => {
  // Cmd/Ctrl/Alt combinations are shortcuts (e.g. switching windows), not navigation
  if (!event.metaKey && !event.ctrlKey && !event.altKey) modality = 'keyboard'
}

/** Starts listening (once). Safe to call from effects; does nothing on the server. */
export const trackInputModality = () => {
  if (tracking || typeof document === 'undefined') return
  tracking = true
  document.addEventListener('keydown', toKeyboard, true)
  document.addEventListener('pointerdown', toPointer, true)
  document.addEventListener('mousedown', toPointer, true)
  document.addEventListener('touchstart', toPointer, true)
}

export const usedKeyboardLast = () => modality === 'keyboard'
