# 🌍 react-world-map-extended

A world map for React that people actually want to click.

Click a country and a tidy card tells you about it. Select up to five countries and compare them in a list.
Bring your own numbers (a simple list of country codes and values) and the map shows *your* data instead.

![A colourful world map with a legend](https://raw.githubusercontent.com/amittkSharma/react-world-map-extended/main/docs/images/hero.png)

> **Status:** pre-release (`0.0.0`), not on npm yet. The API may still change before `0.1.0`.

Built on [`react-svg-worldmap`](https://github.com/ianwilliams/react-svg-worldmap).

## What you get

- 🖱️ **Click a country** and see its capital, region, languages, currency and calling code.
- 🎨 **Two looks:** black and white, or colourful (by continent, by region, or your own colours).
- 🧮 **Select several countries** (up to 5) with Shift+click, and compare them in a list.
- 📊 **Show your own data** from a JSON file. Countries without data turn grey.
- 🪟 **A details card** you can put below, above, beside or on top of the map.
- ⌨️ **Keyboard friendly:** Tab to a country, Enter to select it, Escape to clear.
- 🎛️ **Use the controls anywhere:** the radio buttons also work as a separate component.

## Install

```sh
npm install react-world-map-extended
```

You need `react` and `react-dom` (version 18 or 19). TypeScript types are included.

## Your first map

```tsx
import { ExtendedWorldMap } from 'react-world-map-extended'

export const App = () => <ExtendedWorldMap showDetails />
```

That's it: a map, two small groups of radio buttons ("Map colours" and "Information on click"), and a details card
that fills in when you click a country.

![The details card for France](https://raw.githubusercontent.com/amittkSharma/react-world-map-extended/main/docs/images/details.png)

Want to react to clicks in your own code?

```tsx
<ExtendedWorldMap
  showDetails
  onCountryClick={(info, context) => console.log(context.countryName, info)}
/>
// Clicking France with "Capital" selected logs: France { name: 'France', capital: 'Paris', infoLink: '…' }
```

---

## Everything you can set

Every setting is optional. Add only what you need.

### The basics

| Setting | What it does | Default |
|---|---|---|
| `title` | The map's title. | `'World Map'` |
| `size` | How big the map is: `'sm'`, `'md'`, `'lg'`, `'xl'`, `'xxl'`, `'responsive'` (fills the space it is in) or a number of pixels. | `'xxl'` |
| `mapFrame` | Draws a thin frame around the map. | `false` |
| `interaction` | Turn off to make the map look-only (no hover, no clicks). | `true` |
| `tooltipText` | Choose the text of the hover tooltip: `(ctx) => string`. | the country name |
| `className`, `style` | Style the outer box of the whole component. | none |
| `onCountryClick` | Called on every click. It gets the country's details (or your own data) and some click information. For Northern Cyprus and Somaliland, which have no country code, the details are `undefined`. | none |

### Colours

| Setting | What it does | Default |
|---|---|---|
| `colorMode` / `defaultColorMode` | `'BlackAndWhite'` or `'Colorful'`. Use `colorMode` if you control it yourself, `defaultColorMode` if you only want a starting value. | `'BlackAndWhite'` |
| `onColorModeChange` | Called when the visitor switches the colour mode. | none |
| `palette` | The colour scheme in colourful mode: `'default'` (one colour per country), `'continent'`, `'region'` or `'monochrome'`. | `'default'` |
| `colors` | Your own colours, for colourful mode. Either `{ FR: '#336', DE: '#933' }` (two-letter codes in capitals) or a function that returns a colour per country. Beats `palette`. | none |
| `showLegend` | Shows a small legend that explains the colours. It appears for the `continent` and `region` palettes (and for "No data" when you show your own data). On a small map it moves below the map. | `true` |
| `legendPosition` | Which corner holds the legend: `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`. | `'bottom-left'` |

### Selecting countries

A click selects one country. **Shift+click** (or Cmd/Ctrl+click) adds more, up to **5**.

![Three selected countries in a list](https://raw.githubusercontent.com/amittkSharma/react-world-map-extended/main/docs/images/multi.png)

| You do | What happens |
|---|---|
| Click a country | It becomes the only selected country. |
| Shift+click, Cmd+click or Ctrl+click | Adds the country, or removes it if it was already selected. |
| Shift+Enter on a country you reached with Tab | The same, for keyboard users. |
| Click a country that is already one of several selected | Nothing changes, but that country opens in the details list. |
| Try to add a sixth | It is refused and a small message appears on the map. |
| Press Escape, or use **Clear all**, or the × next to a country | Clears everything, or removes that one country. |

On touch screens there is no Shift key, so a small **Select multiple** switch appears on the map.

| Setting | What it does | Default |
|---|---|---|
| `selectedCountries` | The selected countries, as two-letter codes (`['FR', 'DE']`), in the order they were picked. Use it to control the selection from your own code. `[]` means none. | none |
| `defaultSelectedCountries` | The same, but only as a starting value; the visitor stays in charge. | `[]` |
| `onSelectionChange` | Called with the new list of codes whenever the visitor changes the selection. | none |
| `showMultiSelectToggle` | The "Select multiple" switch: `true`, `false` or `'auto'` (only on touch screens). | `'auto'` |
| `highlightSelected` | Draws a red outline around selected countries. | `true` |
| `dimOthers` | Fades the other countries so the selected ones stand out. `true` fades them to 35%, a number between 0 and 1 sets the strength, `false` turns it off. | `true` |
| `deselectOn` | When does a click clear a single selected country? `'outside'` (clicking empty map or anywhere else on the page), `'background'` (only inside the component) or `'never'`. A selection of two or more is never cleared by a stray click. | `'outside'` |

Control the selection yourself like this:

```tsx
const [countries, setCountries] = useState(['FR', 'DE'])

<ExtendedWorldMap showDetails selectedCountries={countries} onSelectionChange={setCountries} />
```

Unknown codes and duplicates are ignored. If you pass more than five, the first five are shown and a message
explains it.

### The details card

Turn it on with `showDetails`. The card groups facts into **Geography**, **Currency**, **Language** and
**Calling codes**, and links to the country's Wikipedia page ("More information").

| Setting | What it does | Default |
|---|---|---|
| `showDetails` | Shows the details card. | `false` |
| `detailsOptions` | Fine tuning, explained below. | none |
| `infoMode` / `defaultInfoMode` | How much to show: `'CountryName'`, `'CountryCapital'`, `'CountryRegionInfo'`, `'CountryLanguageInfo'`, `'CountryCurrencyInfo'` or `'CountryCompleteInfo'`. | `'CountryName'` |
| `onInfoModeChange` | Called when the visitor picks another amount of information. | none |
| `getInfoLink` | Choose where "More information" points: `(code, name) => url`. Return `undefined` for no link. Only `http` and `https` addresses are shown. | the country's English Wikipedia page |
| `showControls` | Shows the two radio-button groups on the map. Turn off to place them yourself (see *Controls anywhere*). | `true` |

**`detailsOptions`**

| Option | What it does | Default |
|---|---|---|
| `position` | Where the card goes: `'bottom'`, `'top'`, `'left'`, `'right'` or `'overlay'`. | `'bottom'` |
| `open` / `defaultOpen` | Shows or hides the card. Use `open` to control it, `defaultOpen` for a starting value. | `defaultOpen: true` |
| `onOpenChange` | Called when the visitor hides or shows the card. | none |
| `stackBelow` | Width in pixels below which `'left'` and `'right'` move to the top or bottom, because a side card needs room. | `720` |
| `headingLevel` | The heading level of the country name (`1` to `6`), so the card fits your page's outline. | `3` |
| `fontFamily` | Font of the card, for example `'Georgia, serif'`. | the page's font |
| `fontStyle` | Font style of the card, for example `'italic'`. | the page's style |
| `className`, `style` | Style the card itself. | none |

```tsx
<ExtendedWorldMap
  showDetails
  detailsOptions={{ position: 'right', headingLevel: 2, fontFamily: 'Georgia, serif' }}
/>
```

![The details card beside the map](https://raw.githubusercontent.com/amittkSharma/react-world-map-extended/main/docs/images/position-right.png)

- **Bottom and top:** the card is as wide as the map.
- **Left and right:** the card is as tall as the map and scrolls if the content is longer.
- **Overlay:** the card covers the map with a see-through background. While it is open, no country can be clicked.
  Close it with **Hide** or **Escape**.

![The overlay card](https://raw.githubusercontent.com/amittkSharma/react-world-map-extended/main/docs/images/overlay.png)

**Hide and show.** The card has a **Hide** button. When it is hidden and a country is selected, a "Show details"
button brings it back, and clicking a country opens it again. Hiding never clears the selection.

### Showing your own data

Give the map a list of rows. Each row has a `country` code and the values you want to show.

```tsx
const data = [
  { country: 'FR', 'Population (millions)': 68.2, 'Literacy rate (%)': 99, Landlocked: false },
  { country: 'BRA', 'Population (millions)': 214.3, 'Literacy rate (%)': 94, Landlocked: false },
  { country: 'CH', 'Population (millions)': 8.7, Landlocked: true },
]

<ExtendedWorldMap showDetails countryData={data} onDataIssues={(issues) => console.table(issues)} />
```

A JSON file works as it is: `import data from './data.json'` and pass it in.

![The card showing custom data, other countries in grey](https://raw.githubusercontent.com/amittkSharma/react-world-map-extended/main/docs/images/custom-data.png)

The card shows your values, and **the labels are exactly your property names**: write `'Literacy rate (%)'` and that
is what people read. Countries with no data turn grey, and the legend says "No data".

| Setting | What it does | Default |
|---|---|---|
| `countryData` | The list of rows (rules below). | none |
| `detailsSource` | What the card shows. `'custom'`: only your data. `'both'`: your data first, then the built-in facts. `'default'`: ignore your data. | `'custom'` once you pass data |
| `onDataIssues` | Called once with a list of mistakes found in your data (which row, which property, what is wrong). Without it, mistakes are printed as a console warning. | none |
| `greyOutCountriesWithoutData` | Paints countries without data grey. | `true` |

**The rules for your data**

| Part | Rule |
|---|---|
| The list | At most 500 rows. |
| `country` | **Required.** A two-letter (`FR`) or three-letter (`FRA`) country code, in any case. **Country names are not accepted** (they differ between languages). Each country may appear once; if it appears twice, the first row wins. |
| Other properties | At least one and at most 50 per row. The property name is the label. |
| Values | Text (up to 2000 characters), a number, `true` / `false`, or `null` (shown as "—"). No nested objects or lists. Values are shown just as you wrote them. |
| `infoLink` | Optional. Not shown as a value: if it is an `http` or `https` address, it becomes the "More information" link. |

**If there are mistakes,** the map keeps working. The bad rows or values are left out, and you are told what was
wrong. You do not need to wrap your list in `useMemo`.

![Mistakes in the data, reported to your code](https://raw.githubusercontent.com/amittkSharma/react-world-map-extended/main/docs/images/invalid-data.png)

Things to know:

- Northern Cyprus and Somaliland have no country code, so they can never have data. The codes `CYP` and `SOM` mean
  Cyprus and Somalia.
- When only your data is shown, the "Information on click" radio buttons are hidden, because they describe the
  built-in facts.
- Editors can check your JSON file with the published schema: `react-world-map-extended/country-data.schema.json`.

### Controls anywhere

The two radio-button groups are also a component of their own, so you can put them in a sidebar, a toolbar, or
anywhere else.

```tsx
import { ExtendedWorldMap, WorldMapControls, useWorldMapModes } from 'react-world-map-extended'

const modes = useWorldMapModes({ defaultColorMode: 'Colorful' })

<aside><WorldMapControls {...modes} orientation="vertical" /></aside>
<ExtendedWorldMap showControls={false} {...modes} />
```

`useWorldMapModes` remembers the visitor's choices and hands the same ones to both components, so they stay in sync.

**`<WorldMapControls>` settings**

| Setting | What it does | Default |
|---|---|---|
| `colorMode`, `onColorModeChange` | The chosen colour mode and what happens when it changes. | – |
| `infoMode`, `onInfoModeChange` | The chosen amount of information and what happens when it changes. | – |
| `orientation` | `'horizontal'` or `'vertical'` (stacked, good for sidebars). | `'horizontal'` |
| `showInfoModes` | Set to `false` to hide the "Information on click" group (useful with your own data). | `true` |
| `className`, `style` | Style the controls. | – |

Clicking the controls never clears the map's selection.

---

## Other things the package gives you

**Components**

| Name | What it is |
|---|---|
| `ExtendedWorldMap` | The map. |
| `WorldMapControls` | The radio buttons, to place yourself. |
| `CountryDetails` | The details card for one country, to place in your own layout. It takes `selection` (the country's `name` and `detail`, or `null` for the empty hint), `headingLevel`, `fontFamily`, `fontStyle`, `className`, `style` and `onClose`. |
| `CountryDetailsList` | The list for several countries. It takes `selections`, `onRemove`, `onClear`, `onClose` and the same look settings as the card. |

**Hooks**

| Name | What it does |
|---|---|
| `useWorldMapModes(options?)` | Remembers colour mode and information mode, ready to spread onto the map and the controls. |

**Helpers**

| Name | What it does |
|---|---|
| `validateCountryData(data)` | Checks your data without drawing anything. Returns `{ rows, issues }`: the valid rows and a list of what was wrong. Handy in a test. |
| `resolveCountryCode(text)` | Turns `'fra'`, `'FR'` or `' FRA '` into `'FR'`, or `undefined` if it is not a country. |
| `getCountryDetail(code, infoMode, getInfoLink?)` | Looks up the built-in facts of one country. |
| `getWikipediaUrl(code, name)` | The default "More information" link, in case you want to reuse it. |
| `COUNTRY_DATA_LIMITS` | The size limits for your data (500 rows, 50 properties, 2000 characters). |
| `MAX_SELECTED_COUNTRIES` | The most countries that can be selected (5). |
| `MapColorOptions`, `MapDataOptions` | Named values for the colour and information modes. |

**Types:** `MapColorMode`, `MapInfoMode`, `MapPalette`, `CountryColors`, `LegendPosition`, `CountryDetail`,
`InfoLinkResolver`, `DetailsOptions`, `DetailsPosition`, `DetailsSource`, `HeadingLevel`, `CountryDataRow`,
`CountryDataValues`, `CountryDataIssue`, `CountryClickInfo`, `CountryClickContext`, `CountrySelection`,
`CountryDetailsProps`, `CountryDetailsListProps`, `WorldMapControlsProps`, `UseWorldMapModesOptions`, `WorldMapModes`.

## Make it match your site

Change colours with CSS variables. Set them on the map or on any parent element.

```tsx
<ExtendedWorldMap style={{ '--rwme-stroke': '#336' } as React.CSSProperties} />
```

| Variable | What it changes | Default |
|---|---|---|
| `--rwme-fill` | Country colour in black and white mode | `#ffffff` |
| `--rwme-stroke`, `--rwme-stroke-width` | Country borders | `#000000`, `1.2` |
| `--rwme-selected-stroke`, `--rwme-selected-stroke-width` | Outline of selected countries | `#d62828`, `2.5` |
| `--rwme-dimmed-opacity` | How faded the other countries are | `0.35` |
| `--rwme-no-data-fill` | Countries without data | `#e5e7eb` |
| `--rwme-focus-stroke` | Keyboard focus ring | `#1a73e8` |
| `--rwme-linked-glow` | Glow on a country when you point at its entry in the list | `#f59e0b` |
| `--rwme-legend-bg`, `--rwme-legend-text`, `--rwme-legend-border` | The legend box | light |
| `--rwme-panel-bg`, `--rwme-panel-text`, `--rwme-panel-muted`, `--rwme-panel-border`, `--rwme-panel-accent` | The details card | light |
| `--rwme-panel-warning`, `--rwme-panel-warning-bg`, `--rwme-panel-highlight` | The "no details" warning and the highlighted list entry | amber |
| `--rwme-panel-width` | Width of a card on the left or right | `20rem` |
| `--rwme-overlay-bg` | Background of the overlay card | see-through white |

Need more? `styleOverrides` takes a style object (or a function that returns one per country) and is applied last.

## Good to know

- **Own data is shown as a plain list** of label and value pairs. There is no grouping, units or number formatting
  yet, and your data cannot colour the map yet.
- **At most 5 countries** can be selected, and that number cannot be changed yet.
- **Screen readers** announce selections made by clicking, but not selections you set from your own code.
- **Overlay card:** it covers the map, so close it (Hide or Escape) before adding another country.
- **Hover outline:** hovering a selected country makes its outline a little thinner. That style comes from the map
  library underneath.
- **Missing areas:** Antarctica is not drawn. Northern Cyprus and Somaliland stay white in colourful mode and have no
  details.
- **Click-away:** with the default `deselectOn="outside"`, clicking something on your page outside the map clears a
  single selected country. Use `deselectOn="background"` if that is not what you want.
- **Browsers:** tested with automated tests and in Chrome. Real-device and screen-reader testing is still to do.

## Developing this package

```sh
npm run dev            # open the example app
npm run build-package  # lint, type check, test, build
npm run lint:fix       # tidy the code style
```

## License

MIT
