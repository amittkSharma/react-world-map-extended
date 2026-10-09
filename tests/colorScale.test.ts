import { describe, expect, it } from 'vitest'
import { formatNumber, scaleColor, shade } from '../src/lib/colorScale'

describe('shade', () => {
  it('is the colour itself at the top of the scale', () => {
    expect(shade('#1a73e8', 1)).toBe('#1a73e8')
    expect(shade('#000', 1)).toBe('#000000')
    expect(shade('#F00', 1)).toBe('#ff0000')
  })

  it('is a light tint, not white, at the bottom, and clearly apart from the grey of "no data"', () => {
    expect(shade('#000000', 0)).toBe('#bfbfbf') // 25% of the colour, 75% white
    expect(shade('#1a73e8', 0)).toBe('#c6dcf9')
    expect(shade('#1a73e8', 0)).not.toBe('#e5e7eb')
    expect(shade('#ffffff', 0)).toBe('#ffffff')
  })

  it('gets darker the higher the position', () => {
    const lightness = (hex: string) => Number.parseInt(hex.slice(1, 3), 16)
    const steps = [0, 0.25, 0.5, 0.75, 1].map((position) => lightness(shade('#336699', position)))
    expect(steps).toEqual([...steps].sort((a, b) => b - a))
    expect(new Set(steps).size).toBe(5)
  })

  it('keeps a position outside 0 to 1 on the scale', () => {
    expect(shade('#1a73e8', -3)).toBe(shade('#1a73e8', 0))
    expect(shade('#1a73e8', 7)).toBe(shade('#1a73e8', 1))
  })
})

const linear = (min: number, max: number) => ({
  color: '#1a73e8',
  kind: 'linear' as const,
  min,
  max,
  clampedLow: false,
  clampedHigh: false,
  breaks: [],
})

describe('scaleColor', () => {
  const scale = linear(50, 150)

  it('puts the lowest value at the light end and the highest at the colour', () => {
    expect(scaleColor(scale, 50)).toBe(shade('#1a73e8', 0))
    expect(scaleColor(scale, 150)).toBe('#1a73e8')
    expect(scaleColor(scale, 100)).toBe(shade('#1a73e8', 0.5))
  })

  it('works with negative numbers', () => {
    expect(scaleColor(linear(-10, 10), 0)).toBe(shade('#1a73e8', 0.5))
  })

  it('uses the middle when all values are the same', () => {
    expect(scaleColor(linear(7, 7), 7)).toBe(shade('#1a73e8', 0.5))
  })
})

describe('formatNumber', () => {
  it('writes numbers the way the locale does, with at most two decimals', () => {
    expect(formatNumber(83000000)).toBe((83000000).toLocaleString())
    expect(formatNumber(0.123456)).toBe((0.12).toLocaleString())
    expect(formatNumber(99)).toBe('99')
  })
})
