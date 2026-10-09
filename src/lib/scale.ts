/** How numbers become shades. `linear`: proportional. `log`: for data spanning orders of magnitude.
 * `quantile`: classes with the same number of countries, for skewed data. */
export type ScaleKind = 'linear' | 'quantile' | 'log'

export const SCALE_KINDS: readonly ScaleKind[] = ['linear', 'quantile', 'log']

/** The number of classes of a quantile scale. */
export const CLASS_LIMITS = { min: 2, max: 9, default: 5 } as const

/** The scale of a property, worked out from its numbers and its options. */
export interface Scale {
  kind: ScaleKind
  /** The ends of the scale: the lowest and highest number, unless the options set them. */
  min: number
  max: number
  /** Some numbers are below `min` / above `max` and are shown as if they were at the end. */
  clampedLow: boolean
  clampedHigh: boolean
  /** Quantile only: where each class after the first begins (always above `min`, without repeats). */
  breaks: number[]
}

/** The scale options as they come in, before they are checked. */
export interface ScaleOptions {
  scale?: unknown
  classes?: unknown
  min?: unknown
  max?: unknown
}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Where each of `classes` equal-count classes begins, for numbers sorted ascending. A run of equal
 * numbers stays in one class, so a start that would fall on the lowest number moves to the next
 * higher one, and classes that would start at the same number are one.
 */
const quantileBreaks = (sorted: number[], classes: number): number[] => {
  const lowest = sorted[0]
  const above = sorted.find((value) => value > lowest)
  const starts = Array.from({ length: classes - 1 }, (_, index) => {
    const start = sorted[Math.floor(((index + 1) * sorted.length) / classes)]
    return start > lowest ? start : above
  })
  return [...new Set(starts.filter((start): start is number => start !== undefined))]
}

/**
 * Checks the scale options against the numbers of a property and builds its scale. Options that
 * cannot be used are reported (`report`) and replaced by the default; the property stays usable.
 */
export const buildScale = (
  numbers: readonly number[],
  options: ScaleOptions,
  report: (message: string) => void,
): Scale => {
  const dataMin = Math.min(...numbers)
  const dataMax = Math.max(...numbers)

  let kind: ScaleKind = 'linear'
  if (options.scale !== undefined) {
    const known = SCALE_KINDS.find((candidate) => candidate === options.scale)
    if (known) kind = known
    else report(`"scale" must be "linear", "quantile" or "log"; "linear" is used.`)
  }

  let min: number | undefined
  let max: number | undefined
  for (const [key, value] of [
    ['min', options.min],
    ['max', options.max],
  ] as const) {
    if (value === undefined) continue
    if (!isNumber(value)) report(`"${key}" must be a number; it is ignored.`)
    else if (key === 'min') min = value
    else max = value
  }
  if ((min ?? dataMin) >= (max ?? dataMax) && (min !== undefined || max !== undefined)) {
    report(
      `"min" must be less than "max" (the numbers range from ${dataMin} to ${dataMax}); both are ignored.`,
    )
    min = undefined
    max = undefined
  }
  const low = min ?? dataMin
  const high = max ?? dataMax

  if (kind === 'log' && low <= 0) {
    report(
      `A "log" scale needs numbers above zero (it starts at ${low}); "linear" is used. Set "min" above zero to use it.`,
    )
    kind = 'linear'
  }

  let classes: number = CLASS_LIMITS.default
  if (options.classes !== undefined) {
    const { min: fewest, max: most } = CLASS_LIMITS
    const wanted = options.classes
    if (
      typeof wanted === 'number' &&
      Number.isInteger(wanted) &&
      wanted >= fewest &&
      wanted <= most
    ) {
      classes = wanted
    } else {
      report(`"classes" must be a whole number from ${fewest} to ${most}; ${classes} is used.`)
    }
  }
  const breaks =
    kind === 'quantile'
      ? quantileBreaks(
          numbers.map((value) => clamp(value, low, high)).sort((a, b) => a - b),
          classes,
        )
      : []

  return {
    kind,
    min: low,
    max: high,
    clampedLow: min !== undefined && dataMin < min,
    clampedHigh: max !== undefined && dataMax > max,
    breaks,
  }
}

/** The number of shades of a quantile scale (the classes that really have numbers). */
export const classCount = ({ breaks }: Pick<Scale, 'breaks'>) => breaks.length + 1

/** Where a number is on the scale: 0 is the lowest end, 1 the highest, 0.5 when there is only one. */
export const scalePosition = (scale: Scale, value: number): number => {
  const { kind, min, max, breaks } = scale
  const clamped = clamp(value, min, max)
  if (kind === 'quantile') {
    const classes = classCount(scale)
    return classes === 1 ? 0.5 : breaks.filter((start) => clamped >= start).length / (classes - 1)
  }
  if (max === min) return 0.5
  if (kind === 'log') return (Math.log(clamped) - Math.log(min)) / (Math.log(max) - Math.log(min))
  return (clamped - min) / (max - min)
}
