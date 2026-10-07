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
    showDetails
    onCountryClick={(info, context) => console.log(context.countryName, info)}
  />
)
```

By default two radio groups sit above the map: **map colours** (Black and White / Colorful) and
**information on click** (Only Name, Capital, Region, Language, Currency, Complete). Clicking a country highlights
it and calls `onCountryClick` with the fields of the chosen information mode, e.g.
`{ name: 'France', capital: 'Paris', infoLink: 'https://en.wikipedia.org/wiki/France' }`.

`infoLink` is just another field of the country details (present in every mode): a URL with more information about
the country, by default its English Wikipedia page. It does not change the map itself. The details card shows it as a
"More information" link that opens in a new tab; use `getInfoLink` to point it elsewhere. Only `http(s)` URLs are rendered.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | `'World Map'` | Map title. |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'xxl' \| 'responsive' \| number` | `'xxl'` | Map size (same as `react-svg-worldmap`). |
| `onCountryClick` | `(info: CountryDetail \| undefined, context: CountryClickContext) => void` | – | Called on click. `info` is `undefined` for Northern Cyprus and Somaliland (no ISO code). `context` is the `react-svg-worldmap` context plus the click `event`. |
| `onClick` | `(value: string) => void` | – | **Deprecated**, use `onCountryClick`. Receives the details as a JSON string. |
| `tooltipText` | `(ctx: CountryContext<string>) => string` | country name | Custom tooltip text. |
| `getInfoLink` | `(countryCode: string, countryName: string) => string \| undefined` | English Wikipedia page of the country | Where the `infoLink` detail points. Return `undefined` for no link. |
| `mapFrame` | `boolean` | `false` | Draw a frame around the map. |
| `interaction` | `boolean` | `true` | Enable hover/click interaction (`richInteraction`). |
| `showControls` | `boolean` | `true` | Show the radio groups. |
| `colorMode` / `defaultColorMode` / `onColorModeChange` | `'BlackAndWhite' \| 'Colorful'` | `'BlackAndWhite'` | Colour mode; controlled with `colorMode`, otherwise starts at `defaultColorMode`. |
| `infoMode` / `defaultInfoMode` / `onInfoModeChange` | `'CountryName' \| 'CountryCapital' \| 'CountryRegionInfo' \| 'CountryLanguageInfo' \| 'CountryCurrencyInfo' \| 'CountryCompleteInfo'` | `'CountryName'` | Fields reported on click; same controlled/uncontrolled rules. |
| `palette` | `'default' \| 'continent' \| 'region' \| 'monochrome'` | `'default'` | Built-in colours for Colorful mode. |
| `colors` | `Record<ISO2, string> \| (ctx) => string \| undefined` | – | Colours for Colorful mode; wins over `palette`. Keys are upper-case ISO alpha-2 codes. |
| `highlightSelected` | `boolean` | `true` | Outline the clicked country. |
| `showDetails` | `boolean` | `false` | Show a details card under the map (see below). |
| `styleOverrides` | `CSSProperties \| (ctx, { selected }) => CSSProperties` | – | Merged over each country's style, last. |
| `className`, `style` | | – | Applied to the root `div`. |

The enums `MapColorOptions` and `MapDataOptions`, the helper `getCountryDetail(isoCode, infoMode)` and the types
`CountryDetail`, `CountryColors`, `MapPalette`, `MapColorMode`, `MapInfoMode` and `CountryClickContext` are exported too.

### Details panel

`showDetails` renders a card below the map. The country name is the heading; the details are grouped by category
(**Geography**, **Currency**, **Language**, **Calling codes**) and only groups with data for the current information
mode appear. The most important fact of each group (capital, currency code, language, dialling prefix) is set larger.
Three states are distinguished: a dashed neutral card before any click, the details card with an accent bar, and an
amber warning card when a clicked area has no data. The footer holds the `infoLink`. It is an `aria-live` status region, so screen readers announce
changes. Theme it with `--rwme-panel-bg`, `--rwme-panel-text`, `--rwme-panel-muted`, `--rwme-panel-border`,
`--rwme-panel-accent`, `--rwme-panel-warning` and `--rwme-panel-warning-bg`.

### Your own controls

Hide the built-in radios and drive the map from your own state:

```tsx
const [colorMode, setColorMode] = useState<MapColorMode>('Colorful')

<>
  <button onClick={() => setColorMode('BlackAndWhite')}>Plain</button>
  <ExtendedWorldMap showControls={false} colorMode={colorMode} onColorModeChange={setColorMode} />
</>
```

### Styling

Pass `className`/`style` for the wrapper, or theme the countries with CSS custom properties set on any ancestor
(including the wrapper):

| Property | Default | Applies to |
|---|---|---|
| `--rwme-fill` | `#ffffff` | country fill in Black and White mode |
| `--rwme-stroke`, `--rwme-stroke-width` | `#000000`, `1.2` | country border |
| `--rwme-selected-stroke`, `--rwme-selected-stroke-width` | `#d62828`, `2.5` | border of the clicked country |

```tsx
<ExtendedWorldMap style={{ '--rwme-stroke': '#336' } as React.CSSProperties} />
```

For anything else use `styleOverrides`. Hover colours are controlled by `react-svg-worldmap` and are not themeable here.

## Known limitations

- Northern Cyprus and Somaliland have no ISO code in the map data: they stay white in colour mode and `onCountryClick` receives `undefined`.
- Antarctica and the French Southern Territories are not drawn (not supported by `react-svg-worldmap`).
- SVG has no z-index, so the selected country's `<path>` is moved to the end of the map's `<g>` (drawn on top) while it is selected, and put back afterwards. Keyboard focus is restored after each move. Tab order changes while a country is selected: it then comes last. If `react-svg-worldmap` re-creates its country elements (not observed), the highlight can be partly covered until the next click.
- Only one country can be selected, and the selection is not controllable from outside yet.
- Consumer-supplied data (choropleth) is not supported yet.

## Development

```sh
npm run dev            # example app on http://localhost:3000
npm run build-package  # lint, typecheck, test, build
```

## License

MIT
