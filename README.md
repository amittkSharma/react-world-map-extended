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
| `selectedCountries` / `defaultSelectedCountries` / `onSelectionChange` | `string[]` / `string[]` / `(countryCodes: string[]) => void` | `[]` | The selected countries (ISO alpha-2 codes, any case), in the order they were selected, **at most 5**. Controlled with `selectedCountries` (`[]` = none), otherwise it starts at `defaultSelectedCountries` and follows the user. `onSelectionChange` gets the new list (upper-case codes) when the user changes it, never for a click the limit blocks. Unknown codes and duplicates are ignored; a longer array shows its first 5 and a message on the map, and is never written back. See *Selecting several countries*. |
| `showMultiSelectToggle` | `boolean \| 'auto'` | `'auto'` | A small "Select multiple" switch on the map for devices without a Shift key: while it is on, a plain click adds or removes a country. `'auto'` shows it on touch screens only. |
| `tooltipText` | `(ctx: CountryContext<string>) => string` | country name | Text of the styled tooltip shown on hover. |
| `getInfoLink` | `(countryCode: string, countryName: string) => string \| undefined` | English Wikipedia page of the country | Where the `infoLink` detail points. Return `undefined` for no link. |
| `mapFrame` | `boolean` | `false` | Draw a frame around the map. |
| `interaction` | `boolean` | `true` | Enable hover/click interaction (`richInteraction`). |
| `showControls` | `boolean` | `true` | Show the built-in radio groups (the same `<WorldMapControls>` you can use yourself, see below). |
| `colorMode` / `defaultColorMode` / `onColorModeChange` | `'BlackAndWhite' \| 'Colorful'` | `'BlackAndWhite'` | Colour mode; controlled with `colorMode`, otherwise starts at `defaultColorMode`. |
| `infoMode` / `defaultInfoMode` / `onInfoModeChange` | `'CountryName' \| 'CountryCapital' \| 'CountryRegionInfo' \| 'CountryLanguageInfo' \| 'CountryCurrencyInfo' \| 'CountryCompleteInfo'` | `'CountryName'` | Fields reported on click; same controlled/uncontrolled rules. |
| `palette` | `'default' \| 'continent' \| 'region' \| 'monochrome'` | `'default'` | Built-in colours for Colorful mode. |
| `colors` | `Record<ISO2, string> \| (ctx) => string \| undefined` | – | Colours for Colorful mode; wins over `palette`. Keys are upper-case ISO alpha-2 codes. |
| `showLegend` | `boolean` | `true` | Draw a legend over a corner of the map saying what the colours mean. It appears only for the `continent` and `region` palettes, in Colorful mode, without custom `colors` (the other schemes have nothing to explain). It never takes clicks. On a map narrower than 520 px it becomes a wrapping strip under the map instead of covering it, and it steps aside while the `overlay` card is open. |
| `legendPosition` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-left'` | Which corner of the map the legend sits in. |
| `highlightSelected` | `boolean` | `true` | Outline the selected country. Turning it off also turns off `dimOthers`. |
| `deselectOn` | `'outside' \| 'background' \| 'never'` | `'outside'` | When a click clears the selection, restoring the original map: `'outside'` = a click on the map where there is no country, on the empty space around it, or anywhere outside the component; `'background'` = only the map or the space around it inside the component; `'never'`. Clicks on a country, the controls or the details card never clear it, and nothing clears while the `overlay` card is open. **With two or more countries selected, none of this clears them** (one stray click would throw the selection away). **Keyboard:** `Escape` with focus on the map or in the details card clears the selection, also a larger one (not with `'never'`; in the `overlay` card it closes the card instead). With a controlled `selectedCountries`, `onSelectionChange([])` is called and the parent decides. |
| `dimOthers` | `boolean \| number` | `true` | While a country is selected, fade all the others so it stands out. `true` = opacity `0.35`, a number (0–1) sets it, `false` turns it off. Fill and border fade; faded countries stay hoverable and clickable. |
| `showDetails` | `boolean` | `false` | Show the details card (see below). |
| `detailsOptions` | `DetailsOptions` | – | Position, show/hide, headings and fonts of the card (see below). |
| `styleOverrides` | `CSSProperties \| (ctx, { selected }) => CSSProperties` | – | Merged over each country's style, last. |
| `className`, `style` | | – | Applied to the root `div`. |

The enums `MapColorOptions` and `MapDataOptions`, the helper `getCountryDetail(isoCode, infoMode)` and the types
`WorldMapControls` and `useWorldMapModes` (plus their types `WorldMapControlsProps`, `UseWorldMapModesOptions`, `WorldMapModes`), `CountryDetails` and `CountryDetailsList` (components), `MAX_SELECTED_COUNTRIES`, `CountrySelection`, `DetailsOptions`, `DetailsPosition`, `HeadingLevel`, `CountryDetail`, `CountryColors`, `MapPalette`, `MapColorMode`, `MapInfoMode` and `CountryClickContext` are exported too.

### Details card

`showDetails` renders a card for the clicked country. The country name is the heading; the details are grouped by
category (**Geography**, **Currency**, **Language**, **Calling codes**) and only groups with data for the current
information mode appear. The most important fact of each group (capital, currency code, language, dialling prefix)
is set larger. The footer holds the `infoLink`. Three states are distinguished: a dashed neutral card before any
click, the details card with an accent bar, and an amber warning card when a clicked area has no data. It is an
`aria-live` status region, so screen readers announce changes (in the `overlay` position the dialog is the named container and the card inside is just a polite live area, so nothing is announced twice).

Configure it with `detailsOptions`:

| Option | Type | Default | Description |
|---|---|---|---|
| `position` | `'bottom' \| 'top' \| 'left' \| 'right' \| 'overlay'` | `'bottom'` | Where the card sits relative to the map. |
| `open` / `defaultOpen` / `onOpenChange` | `boolean` / `boolean` / `(open: boolean) => void` | `defaultOpen: true` | Show/hide. Controlled with `open`. |
| `stackBelow` | `number` | `720` | Component width (px) below which `'left'` / `'right'` fall back to `'top'` / `'bottom'`, because a side card squeezes the map on a narrow screen. |
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
against the map. In all four, **other countries stay clickable** and update the card. On a narrow component (under `stackBelow`, 720 px by default, measured on the component, not the viewport) `left` and `right` automatically move above and below the map. The alignment is measured from
the map's real `<svg>`, so it holds whatever margins the host page adds. (Beside the map, `size="responsive"` has no
fixed width to hug, so a card on the right may sit apart from a map narrower than the available room.)

**Overlay.** The card itself is the layer: it covers the map exactly (same width and height) with a **translucent**
background (`--rwme-overlay-bg`, default `rgba(255, 255, 255, 0.82)`, plus a light blur) so the map shows through.
While it is open **no country can be clicked**: the map is `inert` (no pointer, keyboard or screen-reader access)
and clicks are ignored. Close it with **Hide** or **Escape**; focus moves into the dialog, Tab stays inside it, and
focus returns to the clicked country afterwards. Nothing opens until a country is selected.

The card is also exported as `CountryDetails` (props: `selection`, `headingLevel`, `fontFamily`, `fontStyle`,
`className`, `style`, `onClose`, and `inDialog` when you put it inside your own named dialog) so you can render it in your own layout, fed from `onCountryClick`. Theme it with
`--rwme-panel-bg`, `--rwme-panel-text`, `--rwme-panel-muted`, `--rwme-panel-border`, `--rwme-panel-accent`,
`--rwme-panel-warning`, `--rwme-panel-warning-bg` and `--rwme-panel-highlight` (the entry being pointed at in the list).

### Selecting several countries

Up to **5** countries can be selected at once (`MAX_SELECTED_COUNTRIES`; not configurable yet).

| You do | What happens |
|---|---|
| Click a country | It becomes the only selected country (a plain click replaces the selection). |
| **Shift**+click, **Cmd**+click or **Ctrl**+click | It is added to the selection, or removed if it was already selected. With the keyboard: **Shift+Enter** on a focused country. (On a Mac, Ctrl+click opens a context menu, use Cmd or Shift.) |
| Click a country that is already part of a selection of two or more | The selection stays as it is; that country **pops up in the details** (its entry opens). |
| Try to add a sixth | It is not added, and a small message appears over the top-right corner of the map. |
| **Escape**, **Clear all**, or the × of one entry | Clears everything / removes that country. |
| Click empty map, or outside, with two or more selected | Nothing: a larger selection is not thrown away by a stray click. |

On touch screens, where there is no Shift key, a **Select multiple** switch appears on the map (see `showMultiSelectToggle`).

**The details card** looks as before for one country. With two or more it becomes a list: one entry per country, its
name as the header, opening to that country's details. A newly added country opens and the older ones close; you can still open several by hand.
Pointing at an entry lights its country on the map, and pointing at a selected country lights its entry. Each entry has
a × to remove it, and the header shows "n of 5" and a **Clear all** button. The list is also exported as
`CountryDetailsList` (props `selections`, `reveal`, `highlightCode`, `onLink`, `onRemove`, `onClear`, `onClose`, plus the
usual `headingLevel`, `fontFamily`, `fontStyle`, `className`, `style`, `inDialog`).

**The message** is a polite status region, closes itself after about 6 seconds (not while the pointer or focus is on
it) and can be dismissed. Changes made by clicking are also announced to screen readers ("Germany added, 3 of 5 selected").

```tsx
const [countries, setCountries] = useState<string[]>(['FR', 'DE'])

<ExtendedWorldMap showDetails selectedCountries={countries} onSelectionChange={setCountries} />
```

A selection set this way highlights the countries and fills the details (and opens the overlay, in `overlay` position)
without any click. **Hide** only hides the card; it does not clear the selection. To clear it, set `selectedCountries`
to `[]`. `onCountryClick` still fires on every click, also for blocked ones.

### Your own controls

The two radio groups are also available as a standalone component, `<WorldMapControls>`, so you can place them
anywhere in your page. Keep the modes in your own state with `useWorldMapModes()`; its result has exactly the props
both components take, so one spread wires them together:

```tsx
import { ExtendedWorldMap, WorldMapControls, useWorldMapModes } from 'react-world-map-extended'

const modes = useWorldMapModes({ defaultColorMode: 'Colorful' }) // { colorMode, infoMode, onColorModeChange, onInfoModeChange }

<aside><WorldMapControls {...modes} className="sidebar-controls" /></aside>
<ExtendedWorldMap showControls={false} {...modes} />
```

`<WorldMapControls>` is always controlled (`colorMode`, `onColorModeChange`, `infoMode`, `onInfoModeChange`) and also takes
`className`, `style` and `orientation` (`'horizontal'` by default; `'vertical'` stacks the groups and their options, for a
sidebar). Clicking it never clears the map's selection, even though it sits outside the map. Prefer
your own markup? Skip it and drive the map with `colorMode` / `infoMode` and their `on…Change` callbacks directly:

```tsx
const [colorMode, setColorMode] = useState<MapColorMode>('Colorful')
<ExtendedWorldMap showControls={false} colorMode={colorMode} onColorModeChange={setColorMode} />
```

### Styling

Pass `className`/`style` for the wrapper, or theme the countries with CSS custom properties set on any ancestor
(including the wrapper):

| Property | Default | Applies to |
|---|---|---|
| `--rwme-fill` | `#ffffff` | country fill in Black and White mode |
| `--rwme-stroke`, `--rwme-stroke-width` | `#000000`, `1.2` | country border |
| `--rwme-focus-stroke` | `#1a73e8` | the keyboard focus ring of a country |
| `--rwme-linked-glow` | `#f59e0b` | the glow on a country whose details entry is being pointed at |
| `--rwme-selected-stroke`, `--rwme-selected-stroke-width` | `#d62828`, `2.5` | border of the selected country |
| `--rwme-legend-bg`, `--rwme-legend-text`, `--rwme-legend-border` | translucent white, `#1f2328`, `#d0d7de` | the legend box |
| `--rwme-dimmed-opacity` | `0.35` (or the `dimOthers` number) | opacity of the other countries while one is selected |

```tsx
<ExtendedWorldMap style={{ '--rwme-stroke': '#336' } as React.CSSProperties} />
```

For anything else use `styleOverrides`. Hover colours are controlled by `react-svg-worldmap` and are not themeable here.

## Known limitations

- In the `overlay` position every selection opens the card over the map, which blocks it; close the card (Hide or Escape) before adding the next country.
- The limit of 5 is fixed for now. The switch for touch screens appears when the device reports a touch pointer at load; it does not react to a device changing mode afterwards.
- Only changes made by clicking are announced to screen readers; a selection changed by your code (`selectedCountries`) is not.
- Keyboard focus on a country is drawn by this package (a glow along its outline; its red outline turns dashed when it is also the selected one), not by the browser, whose own ring is a box around the whole country. Mouse clicks never show a ring. The library restyles a focused country's border over ours, so the glow does most of the work; it relies on CSS `filter`, which older Safari versions may ignore on SVG shapes.
- With `top` / `bottom` the card appears and disappears next to the map, so the page below it moves; `left`, `right` and `overlay` do not shift the layout.
- `react-svg-worldmap` gives every country a styled tooltip and also a native `<title>` that browsers show as a second, plain tooltip. This package removes the `<title>` (each country keeps its `aria-label`), so you get one tooltip. It relies on the library's markup; if you pass your own `data` in the future, countries without a value keep only the native one.
- The legend only explains the `continent` and `region` palettes. Custom `colors`, the default per-country colours and `monochrome` have no legend (a legend for your own data comes with the planned data-driven map). Its swatches keep their full colours while `dimOthers` fades the map.
- With the default `deselectOn="outside"`, a click on any element of your page outside the map (a dropdown, a button) clears the selection; if those elements should keep it, use `deselectOn="background"`.
- `react-svg-worldmap` restyles a hovered country's border (width 2, a bit more opaque) over whatever this package sets, so hovering the selected country thins its outline slightly (2 instead of 2.5).
- When `showDetails` is on, the component sets `margin: 0` on the `<figure>` that `react-svg-worldmap` renders (the browser's default 40px side margin is not accounted for by the library and pushed the map into a neighbouring card), and measures the map's `<svg>` to align the card.
- Northern Cyprus and Somaliland have no ISO code in the map data: they stay white in colour mode (they do get the normal tooltip) and `onCountryClick` receives `undefined`.
- Antarctica and the French Southern Territories are not drawn (not supported by `react-svg-worldmap`).
- SVG has no z-index, so the selected country's `<path>` is moved to the end of the map's `<g>` (drawn on top) while it is selected, and put back afterwards. Keyboard focus is restored after each move. Tab order changes while a country is selected: it then comes last. If `react-svg-worldmap` re-creates its country elements (not observed), the highlight can be partly covered until the next click.
- Only one country can be selected at a time.
- Consumer-supplied data (choropleth) is not supported yet.

## Development

```sh
npm run dev            # example app (the URL is printed, path /example)
npm run build-package  # lint, typecheck, test, build
npm run lint           # Biome; any warning fails
npm run lint:fix       # apply Biome's safe fixes (unsafe ones: npx biome check --write --unsafe)
```

The example app (`example/`, TypeScript) accepts query-string hooks for repeatable screenshots, documented at the top of
`example/scenario.ts`, e.g. `/example?position=right&select=Germany&then=escape`. Its "Radio controls" dropdown shows the
built-in radios versus a separate `<WorldMapControls>` placed around the map.

## License

MIT
