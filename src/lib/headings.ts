import type { HeadingLevel } from '../types'

/** The heading element for `level`; levels beyond 6 stay at `h6`. */
export const headingTag = (level: number) => `h${Math.min(level, 6)}` as `h${HeadingLevel}`
