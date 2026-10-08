// The lowest value is not white: a light tint of the colour that stays clearly apart from both the
// white of a map without colour and the grey of a country without data
const LOWEST_STRENGTH = 0.25

const toRgb = (hex: string): [number, number, number] => {
  const digits = hex.replace('#', '')
  const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits
  return [0, 2, 4].map((start) => Number.parseInt(full.slice(start, start + 2), 16)) as [
    number,
    number,
    number,
  ]
}

const toHex = (channels: number[]) =>
  `#${channels.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`

/** The colour at `position` on a scale of one colour: 0 is its light tint, 1 the colour itself. */
export const shade = (color: string, position: number): string => {
  const strength = LOWEST_STRENGTH + (1 - LOWEST_STRENGTH) * Math.min(1, Math.max(0, position))
  return toHex(toRgb(color).map((channel) => 255 + (channel - 255) * strength))
}

/** The colour of `value` on the scale from `min` to `max` (all the same value: the middle). */
export const scaleColor = (
  { color, min, max }: { color: string; min: number; max: number },
  value: number,
): string => shade(color, max === min ? 0.5 : (value - min) / (max - min))

/** A number the way the visitor's language writes it (`83,000,000`), without long decimals. */
export const formatNumber = (value: number): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: 2 })
