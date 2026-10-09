/** How many countries can be selected at once unless `maxSelected` says otherwise. */
export const MAX_SELECTED_COUNTRIES = 5

/** From this many selected countries the details are a table, unless `tableFrom` says otherwise. */
export const TABLE_FROM = 6

/** A whole number of at least `min` (`Infinity` is allowed); anything else is `fallback`. */
export const resolveCount = (value: unknown, fallback: number, min = 1) =>
  typeof value === 'number' && !Number.isNaN(value) && Math.floor(value) >= min
    ? Math.floor(value)
    : fallback

/** "2 of 5" with a limit, "2 selected" without one. */
export const selectionCount = (count: number, max: number) =>
  Number.isFinite(max) ? `${count} of ${max}` : `${count} selected`
