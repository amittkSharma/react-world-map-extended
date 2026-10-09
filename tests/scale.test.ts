import { describe, expect, it } from 'vitest'
import { buildScale, CLASS_LIMITS, classCount, type Scale, scalePosition } from '../src/lib/scale'

const build = (numbers: number[], options = {}) => {
  const messages: string[] = []
  const scale = buildScale(numbers, options, (message) => messages.push(message))
  return { scale, messages }
}

const positions = (scale: Scale, numbers: number[]) =>
  numbers.map((value) => scalePosition(scale, value))

describe('the linear scale', () => {
  it('runs from the lowest to the highest number', () => {
    const { scale, messages } = build([50, 100, 150])
    expect(messages).toEqual([])
    expect(scale).toEqual({
      kind: 'linear',
      min: 50,
      max: 150,
      clampedLow: false,
      clampedHigh: false,
      breaks: [],
    })
    expect(positions(scale, [50, 75, 100, 150])).toEqual([0, 0.25, 0.5, 1])
  })

  it('puts a single number, or all equal numbers, in the middle', () => {
    for (const numbers of [[7], [7, 7, 7]]) {
      const { scale } = build(numbers)
      expect(scalePosition(scale, 7)).toBe(0.5)
    }
  })

  it('is pulled flat by one very large number (the problem the other scales solve)', () => {
    const { scale } = build([1, 2, 3, 4, 5, 1000])
    expect(scalePosition(scale, 5)).toBeLessThan(0.005)
  })
})

describe('min and max', () => {
  it('set the ends of the scale, and numbers beyond them are shown at the ends', () => {
    const { scale, messages } = build([1, 50, 75, 1000], { min: 50, max: 100 })
    expect(messages).toEqual([])
    expect(scale).toMatchObject({ min: 50, max: 100, clampedLow: true, clampedHigh: true })
    expect(positions(scale, [1, 50, 75, 100, 1000])).toEqual([0, 0, 0.5, 1, 1])
  })

  it('are not "clamped" when no number is beyond them', () => {
    const { scale } = build([60, 70, 80], { min: 50, max: 100 })
    expect(scale).toMatchObject({ min: 50, max: 100, clampedLow: false, clampedHigh: false })
    expect(scalePosition(scale, 60)).toBeCloseTo(0.2)
  })

  it('can be given one at a time', () => {
    expect(build([1, 5, 10], { max: 5 }).scale).toMatchObject({ min: 1, max: 5, clampedHigh: true })
    expect(build([1, 5, 10], { min: 5 }).scale).toMatchObject({ min: 5, max: 10, clampedLow: true })
  })

  it.each([
    [{ min: 10, max: 10 }],
    [{ min: 20, max: 10 }],
    [{ min: 500 }], // above every number
    [{ max: 0 }], // below every number
  ])('are ignored together, and reported, when they leave no room (%j)', (options) => {
    const { scale, messages } = build([1, 5, 10], options)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toContain('"min" must be less than "max"')
    expect(scale).toMatchObject({ min: 1, max: 10, clampedLow: false, clampedHigh: false })
  })

  it.each([['text'], [Number.NaN], [Number.POSITIVE_INFINITY], [null], [true]])(
    'must be numbers: %j is ignored and reported',
    (value) => {
      const { scale, messages } = build([1, 5, 10], { min: value })
      expect(messages).toEqual(['"min" must be a number; it is ignored.'])
      expect(scale.min).toBe(1)
    },
  )
})

describe('the quantile scale', () => {
  // one huge number: linear would make everything else look the same
  const skewed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 1000]

  it('gives every class the same number of countries, whatever the size of the numbers', () => {
    const { scale, messages } = build(skewed, { scale: 'quantile' })
    expect(messages).toEqual([])
    expect(scale.breaks).toEqual([3, 5, 7, 9])
    expect(classCount(scale)).toBe(5)
    expect(positions(scale, skewed)).toEqual([0, 0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1, 1])
  })

  it('uses the number of classes asked for', () => {
    const { scale } = build(skewed, { scale: 'quantile', classes: 2 })
    expect(scale.breaks).toEqual([6])
    expect(positions(scale, [1, 5, 6, 1000])).toEqual([0, 0, 1, 1])
  })

  it('keeps equal numbers in one class', () => {
    const { scale } = build([1, 1, 1, 1, 1, 5], { scale: 'quantile' })
    expect(scale.breaks).toEqual([5])
    expect(positions(scale, [1, 5])).toEqual([0, 1])
  })

  it('uses fewer classes when there are fewer different numbers', () => {
    const { scale } = build([1, 2, 2, 3], { scale: 'quantile', classes: 9 })
    expect(classCount(scale)).toBeLessThanOrEqual(3)
    expect(scalePosition(scale, 1)).toBe(0)
    expect(scalePosition(scale, 3)).toBe(1)
  })

  it('puts all equal numbers in the middle', () => {
    const { scale } = build([4, 4, 4], { scale: 'quantile' })
    expect(scale.breaks).toEqual([])
    expect(scalePosition(scale, 4)).toBe(0.5)
  })

  it('builds its classes from the numbers after min and max have been applied', () => {
    expect(build(skewed, { scale: 'quantile' }).scale.breaks).toEqual([3, 5, 7, 9])
    expect(build(skewed, { scale: 'quantile', max: 6 }).scale.breaks).toEqual([3, 5, 6])
  })

  it('works on the numbers after min and max have been applied', () => {
    const { scale } = build([1, 2, 3, 4, 5, 6, 7, 8, 9, 1000], { scale: 'quantile', max: 10 })
    expect(scale).toMatchObject({ max: 10, clampedHigh: true })
    expect(scalePosition(scale, 1000)).toBe(1)
  })

  it.each([[1], [10], [2.5], ['5'], [null], [Number.NaN]])(
    'rejects classes %j: it is reported and 5 is used',
    (classes) => {
      const { scale, messages } = build(skewed, { scale: 'quantile', classes })
      expect(messages).toEqual([
        `"classes" must be a whole number from ${CLASS_LIMITS.min} to ${CLASS_LIMITS.max}; 5 is used.`,
      ])
      expect(classCount(scale)).toBe(5)
    },
  )

  it('checks classes whatever the scale, and does not use them for the others', () => {
    const { scale, messages } = build(skewed, { classes: 20 })
    expect(messages).toHaveLength(1)
    expect(scale.breaks).toEqual([])
    expect(build(skewed, { classes: 3 }).messages).toEqual([])
  })
})

describe('the log scale', () => {
  it('spaces the numbers by powers: 10 is the middle of 1 to 100', () => {
    const { scale, messages } = build([1, 10, 100], { scale: 'log' })
    expect(messages).toEqual([])
    expect(positions(scale, [1, 10, 100])).toEqual([0, 0.5, 1])
  })

  it('keeps small numbers apart where a linear scale would not', () => {
    const numbers = [1, 10, 100, 1_000_000]
    const log = build(numbers, { scale: 'log' }).scale
    const linear = build(numbers).scale
    expect(scalePosition(log, 10)).toBeGreaterThan(0.1)
    expect(scalePosition(linear, 10)).toBeLessThan(0.0001)
  })

  it.each([[[0, 5, 10]], [[-3, 5, 10]]])(
    'needs numbers above zero: %j uses linear and says so',
    (numbers) => {
      const { scale, messages } = build(numbers, { scale: 'log' })
      expect(scale.kind).toBe('linear')
      expect(messages).toHaveLength(1)
      expect(messages[0]).toContain('needs numbers above zero')
    },
  )

  it('works with a min above zero that leaves out the zero and negatives', () => {
    const { scale, messages } = build([0, 5, 50, 500], { scale: 'log', min: 5 })
    expect(messages).toEqual([])
    expect(scale).toMatchObject({ kind: 'log', min: 5, clampedLow: true })
    expect(scalePosition(scale, 0)).toBe(0)
  })
})

describe('an unknown scale', () => {
  it.each([['cubic'], ['Linear'], [3], [null]])('%j is reported and linear is used', (scale) => {
    const result = build([1, 2, 3], { scale })
    expect(result.scale.kind).toBe('linear')
    expect(result.messages).toEqual([
      '"scale" must be "linear", "quantile" or "log"; "linear" is used.',
    ])
  })
})
