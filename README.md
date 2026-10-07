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
| `selectedCountry` / `defaultSelectedCountry` / `onSelectionChange` | `string \| null` / `string \| null` / `(countryCode: string \| null) => void` | `null` | The highlighted country and the one in the details card, as an ISO alpha-2 code (any case). Controlled with `selectedCountry` (`null` = none), otherwise it starts at `defaultSelectedCountry` and follows clicks. `onSelectionChange` gets the upper-case code when a click selects a different country. Unknown codes select nothing. |
| `tooltipText` | `(ctx: CountryContext<string>) => string` | country name | Custom tooltip text. |
| `getInfoLink` | `(countryCode: string, countryName: string) => string \| undefined` | English Wikipedia page of the country | Where the `infoLink` detail points. Return `undefined` for no link. |
| `mapFrame` | `boolean` | `false` | Draw a frame around the map. |
| `interaction` | `boolean` | `true` | Enable hover/click interaction (`richInteraction`). |
| `showControls` | `boolean` | `true` | Show the radio groups. |
| `colorMode` / `defaultColorMode` / `onColorModeChange` | `'BlackAndWhite' \| 'Colorful'` | `'BlackAndWhite'` | Colour mode; controlled with `colorMode`, otherwise starts at `defaultColorMode`. |
| `infoMode` / `defaultInfoMode` / `onInfoModeChange` | `'CountryName' \| 'CountryCapital' \| 'CountryRegionInfo' \| 'CountryLanguageInfo' \| 'CountryCurrencyInfo' \| 'CountryCompleteInfo'` | `'CountryName'` | Fields reported on click; same controlled/uncontrolled rules. |
| `palette` | `'default' \| 'continent' \| 'region' \| 'monochrome'` | `'default'` | Built-in colours for Colorful mode. |
| `colors` | `Record<ISO2, string> \| (ctx) => string \| undefined` | – | Colours for Colorful mode; wins over `palette`. Keys are upper-case ISO alpha-2 codes. |
| `highlightSelected` | `boolean` | `true` | Outline the selected country. Turning it off also turns off `dimOthers`. |
| `deselectOn` | `'outside' \| 'background' \| 'never'` | `'outside'` | When a click clears the selection, restoring the original map: `'outside'` = a click on the map where there is no country, on the empty space around it, or anywhere outside the component; `'background'` = only the map or the space around it inside the component; `'never'`. Clicks on a country, the controls or the details card never clear it, and nothing clears while the `overlay` card is open. With a controlled `selectedCountry`, `onSelectionChange(null)` is called and the parent decides. |
| `dimOthers` | `boolean \| number` | `true` | While a country is selected, fade all the others so it stands out. `true` = opacity `0.35`, a number (0–1) sets it, `false` turns it off. Fill and border fade; faded countries stay hoverable and clickable. |
| `showDetails` | `boolean` | `false` | Show the details card (see below). |
| `detailsOptions` | `DetailsOptions` | – | Position, show/hide, headings and fonts of the card (see below). |
| `styleOverrides` | `CSSProperties \| (ctx, { selected }) => CSSProperties` | – | Merged over each country's style, last. |
| `className`, `style` | | – | Applied to the root `div`. |

The enums `MapColorOptions` and `MapDataOptions`, the helper `getCountryDetail(isoCode, infoMode)` and the types
`CountryDetails` (component), `DetailsOptions`, `DetailsPosition`, `HeadingLevel`, `CountryDetail`, `CountryColors`, `MapPalette`, `MapColorMode`, `MapInfoMode` and `CountryClickContext` are exported too.

### Details card

`showDetails` renders a card for the clicked country. The country name is the heading; the details are grouped by
category (**Geography**, **Currency**, **Language**, **Calling codes**) and only groups with data for the current
information mode appear. The most important fact of each group (capital, currency code, language, dialling prefix)
is set larger. The footer holds the `infoLink`. Three states are distinguished: a dashed neutral card before any
click, the details card with an accent bar, and an amber warning card when a clicked area has no data. It is an
`aria-live` status region, so screen readers announce changes.

Configure it with `detailsOptions`:

| Option | Type | Default | Description |
|---|---|---|---|
| `position` | `'bottom' \| 'top' \| 'left' \| 'right' \| 'overlay'` | `'bottom'` | Where the card sits relative to the map. |
| `open` / `defaultOpen` / `onOpenChange` | `boolean` / `boolean` / `(open: boolean) => void` | `defaultOpen: true` | Show/hide. Controlled with `open`. |
| `headingLevel` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `3` | Level of the country-name heading; category headings use the next level (max `h6`). |
| `fontFamily` | `string` | inherited | CSS `font-family` of the card and its buttons. |
| `fontStyle` | `string` | inherited | CSS `font-style` of the card and its buttons. |
| `className`, `style` | | – | Applied to the card (`style` last). |

```tsx
<ExtendedWorldMap
  showDetails
  detailsOptions={{ position: 'right', headingLevel: 2, fontFamily: 'Georgia, serif', fontStyle: 'normal' }}
/>
```

**Show / hide.** The card has a **Hide** button. While hidden and a country is selected, a **Show details: <country>**
button brings it back, and clicking a country reopens it. Control it yourself with `open` + `onOpenChange`.

**Positions.** `top`/`bottom` place the card above/below the map, **exactly as wide as the map** and starting at its
left edge. `left`/`right` place it beside the map, **exactly as tall as the map** (the card scrolls if its content is
longer) and starting at the map's top edge; its width is `--rwme-panel-width` (default `20rem`) and it sits flush
against the map. In all four, **other countries stay clickable** and update the card. The alignment is measured from
the map's real `<svg>`, so it holds whatever margins the host page adds. (Beside the map, `size="responsive"` has no
fixed width to hug, so a card on the right may sit apart from a map narrower than the available room.)

**Overlay.** The card itself is the layer: it covers the map exactly (same width and height) with a **translucent**
background (`--rwme-overlay-bg`, default `rgba(255, 255, 255, 0.82)`, plus a light blur) so the map shows through.
While it is open **no country can be clicked**: the map is `inert` (no pointer, keyboard or screen-reader access)
and clicks are ignored. Close it with **Hide** or **Escape**; focus moves into the dialog, Tab stays inside it, and
focus returns to the clicked country afterwards. Nothing opens until a country is selected.

The card is also exported as `CountryDetails` (props: `selection`, `headingLevel`, `fontFamily`, `fontStyle`,
`className`, `style`, `onClose`) so you can render it in your own layout, fed from `onCountryClick`. Theme it with
`--rwme-panel-bg`, `--rwme-panel-text`, `--rwme-panel-muted`, `--rwme-panel-border`, `--rwme-panel-accent`,
`--rwme-panel-warning` and `--rwme-panel-warning-bg`.

### Selecting a country from your own code

```tsx
const [country, setCountry] = useState<string | null>('FR')

<select value={country ?? ''} onChange={(e) => setCountry(e.target.value || null)}>…</select>
<ExtendedWorldMap showDetails selectedCountry={country} onSelectionChange={setCountry} />
```

A selection set this way highlights the country and fills the details card (and opens the overlay, in `overlay`
position) without any click. **Hide** only hides the card; it does not clear the selection. To clear it, set
`selectedCountry` to `null`. `onCountryClick` still fires on every click, even on the selected country.

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
| `--rwme-selected-stroke`, `--rwme-selected-stroke-width` | `#d62828`, `2.5` | border of the selected country |
| `--rwme-dimmed-opacity` | `0.35` (or the `dimOthers` number) | opacity of the other countries while one is selected |

```tsx
<ExtendedWorldMap style={{ '--rwme-stroke': '#336' } as React.CSSProperties} />
```

For anything else use `styleOverrides`. Hover colours are controlled by `react-svg-worldmap` and are not themeable here.

## Known limitations

- With the default `deselectOn="outside"`, a click on any element of your page outside the map (a dropdown, a button) clears the selection; if those elements should keep it, use `deselectOn="background"`.
- `react-svg-worldmap` restyles a hovered country's border (width 2, a bit more opaque) over whatever this package sets, so hovering the selected country thins its outline slightly (2 instead of 2.5).
- When `showDetails` is on, the component sets `margin: 0` on the `<figure>` that `react-svg-worldmap` renders (the browser's default 40px side margin is not accounted for by the library and pushed the map into a neighbouring card), and measures the map's `<svg>` to align the card.
- Northern Cyprus and Somaliland have no ISO code in the map data: they stay white in colour mode and `onCountryClick` receives `undefined`.
- Antarctica and the French Southern Territories are not drawn (not supported by `react-svg-worldmap`).
- SVG has no z-index, so the selected country's `<path>` is moved to the end of the map's `<g>` (drawn on top) while it is selected, and put back afterwards. Keyboard focus is restored after each move. Tab order changes while a country is selected: it then comes last. If `react-svg-worldmap` re-creates its country elements (not observed), the highlight can be partly covered until the next click.
- Only one country can be selected at a time.
- Consumer-supplied data (choropleth) is not supported yet.

## Development

```sh
npm run dev            # example app on http://localhost:3000
npm run build-package  # lint, typecheck, test, build
```

## License

MIT
