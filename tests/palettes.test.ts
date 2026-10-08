import { describe, expect, it } from 'vitest'
import { countryColors } from '../src/data/defaultMapData'
import { getPaletteColors } from '../src/lib/palettes'

describe('getPaletteColors', () => {
  const codes = Object.keys(countryColors)

  it.each(['default', 'continent', 'region', 'monochrome'] as const)(
    '%s colours every country on the map',
    (palette) => {
      const colors = getPaletteColors(palette)
      expect(codes.filter((code) => !(code in colors))).toEqual([])
    },
  )

  it('groups by continent and by region', () => {
    const continent = getPaletteColors('continent')
    expect(continent.FR).toBe(continent.DE)
    expect(continent.FR).not.toBe(continent.JP)

    const region = getPaletteColors('region')
    expect(region.NG).toBe(region.GH)
    expect(region.NG).not.toBe(region.FR)
  })

  it('uses one colour for monochrome', () => {
    expect(new Set(Object.values(getPaletteColors('monochrome'))).size).toBe(1)
  })

  it('returns the same object on repeated calls (cached)', () => {
    expect(getPaletteColors('continent')).toBe(getPaletteColors('continent'))
  })
})
