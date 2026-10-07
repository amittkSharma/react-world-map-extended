# react-world-map-extended

An interactive SVG world map for React, built on [`react-svg-worldmap`](https://github.com/ianwilliams/react-svg-worldmap).
It adds a black-and-white / colourful switch and returns country details (capital, region, languages, currency)
when a country is clicked.

> Status: pre-release (`0.0.0`), not yet published to npm.

## Install

```sh
npm install react-world-map-extended
```

Requires `react` 18 or 19 (and `react-dom`) as peer dependencies. Ships ESM, CommonJS and TypeScript types.

## Usage

```tsx
import { ExtendedWorldMap } from 'react-world-map-extended'

export const App = () => (
  <ExtendedWorldMap
    title="Countries"
    size="xl"
    mapFrame
    onClick={(json) => console.log(JSON.parse(json))}
  />
)
```

Above the map, two radio groups let the user choose the **map colours** (Black and White / Colorful) and the
**information returned on click** (Only Name, Capital, Region, Language, Currency, Complete). Clicking a country
calls `onClick` with a JSON string such as `{"name":"France","capital":"Paris"}`.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | `'World Map'` | Map title. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl' \| 'responsive' \| number` | `'xxl'` | Map size (same as `react-svg-worldmap`). |
| `onClick` | `(value: string) => void` | – | Called on country click with the details as a JSON string. |
| `tooltipText` | `(ctx: CountryContext<string>) => string` | country name | Custom tooltip text. |
| `infoLink` | `boolean` | `false` | Wrap countries in a link to their Wikipedia page. |
| `mapFrame` | `boolean` | `false` | Draw a frame around the map. |
| `interaction` | `boolean` | `true` | Enable hover/click interaction (`richInteraction`). |

## Known limitations

- The selector UI is always shown and cannot be hidden or controlled from outside yet.
- `onClick` receives a JSON **string**, not an object.
- Northern Cyprus and Somaliland have no ISO code in the map data: they stay white in colour mode and return `{}` on click.
- Antarctica and the French Southern Territories are not drawn (not supported by `react-svg-worldmap`).
- The colour palette is fixed.

## Development

```sh
npm run dev            # example app on http://localhost:3000
npm run build-package  # lint, typecheck, test, build
```

## License

MIT
