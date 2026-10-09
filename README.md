# 🌍 react-world-map-extended

A world map for React that people actually want to click.

Click a country and a tidy card tells you about it. Select up to five countries and compare them in a list.
Bring your own numbers (a simple JSON file of country codes and values) and the map turns into a shaded data map.

![A colourful world map with a legend](https://raw.githubusercontent.com/amittkSharma/react-world-map-extended/main/docs/images/hero.png)

> **Status:** pre-release (`0.0.0`), not on npm yet. The API may still change before `0.1.0`.

Built on [`react-svg-worldmap`](https://github.com/ianwilliams/react-svg-worldmap).

## What you get

- 🖱️ **Click a country** and see its capital, region, languages, currency and calling code.
- 🎨 **Two looks:** black and white, or colourful (by continent, by region, or your own colours).
- 🧮 **Select several countries** (up to 5) with Shift+click, and compare them in a list.
- 📊 **Colour the map with your own numbers** from a JSON file: darker means higher, with a legend, a dropdown to switch between your properties, and linear, quantile or log scales for skewed data.
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
| `showLegend` | Shows a small legend that explains the colours. With the built-in data it appears for the `continent` and `region` palettes. With your own data it is the colour scale (see *Showing your own data*). On a small map it moves below the map. | `true` |
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
| `dimOthers` | Fades the other countries so the selected ones stand out. `true` fades them to 35%, a number between 0 and 1 sets the strength, `false` turns it off. | `true`, but `false` while your own data colours the map (fading would change the shades) |
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

Give the map a JSON file (or an object) with two lists: the **properties** you want to show, each with its own colour,
and a row of numbers for each **country**.

```tsx
const data = {
  properties: [
    { name: 'Literacy rate (%)', color: '#1a73e8' },
    { name: 'Population (millions)', color: '#d55e00' },
  ],
  countries: [
    { country: 'FR', 'Literacy rate (%)': 99, 'Population (millions)': 68.2 },
    { country: 'BRA', 'Literacy rate (%)': 94, 'Population (millions)': 214.3 },
    { country: 'CH', 'Literacy rate (%)': 99, 'Population (millions)': null },
  ],
}

<ExtendedWorldMap showDetails countryData={data} onDataIssues={(issues) => console.table(issues)} />
```

A JSON file works as it is: `import data from './data.json'` and pass it in.

![The map coloured by literacy rate, with a legend and the card](https://raw.githubusercontent.com/amittkSharma/react-world-map-extended/main/docs/images/custom-data.png)

**What the map does with it**

- Each country is shaded by its number for the chosen property: the **highest** number gets the property's colour, the
  **lowest** a light tint of it, the rest sit in between. If a few very large numbers make everything else look alike,
  choose another `scale` (see *Skewed data*).
- A country with no number for that property (no row, or `null`) is **grey**.
- A **legend** shows the property's name, the lowest and highest numbers, and "No data".
- With **two or more properties** a "Show on map" dropdown appears. Pick another one and the map, the legend and the
  card update straight away. With one property there is no dropdown.
- The card lists your properties, **labelled exactly as you named them**, with the chosen one first. `null` shows as "—".
- The map starts **colourful** (switch to Black and White and the colours and legend go away).
- The other countries are **not faded** when you select one, so the shades keep their meaning. Set `dimOthers` to bring it back.

![The same map showing the population property](https://raw.githubusercontent.com/amittkSharma/react-world-map-extended/main/docs/images/custom-data-property.png)

| Setting | What it does | Default |
|---|---|---|
| `countryData` | Your data (rules below). | none |
| `dataProperty` / `defaultDataProperty` | Which property colours the map. Use `dataProperty` to control it yourself, `defaultDataProperty` for a starting value. An unknown name means the first property. | the first property |
| `onDataPropertyChange` | Called with the property's name when the visitor picks another one. | none |
| `detailsSource` | What the card shows. `'custom'`: only your data. `'both'`: your data first, then the built-in facts. `'default'`: ignore your data (the map is then the normal map). | `'custom'` once you pass data |
| `onDataIssues` | Called once with a list of mistakes found in your data (which row, which property, what is wrong). Without it, mistakes are printed as a console warning. | none |
| `greyOutCountriesWithoutData` | Paints countries without a number grey and adds "No data" to the legend. | `true` |

**The rules for your data**

| Part | Rule |
|---|---|
| The data | An object with `properties` and `countries`. |
| `properties` | A list of 1 to 50 entries `{ name, color }`. `name` is the label (not empty, used once, not `country` or `infoLink`). `color` is a hex colour: `#336` or `#3366aa`. Each entry may also have `scale`, `classes`, `min` and `max` (see *Skewed data*). |
| `countries` | A list of at most 500 rows. |
| `country` in a row | **Required.** A two-letter (`FR`) or three-letter (`FRA`) country code, in any case. **Country names are not accepted** (they differ between languages). Each country may appear once; if it appears twice, the first row wins. |
| A property's value in a row | A number, or `null` for "no value". Text, true/false, lists and objects are not accepted. |
| Other things in a row | Properties you did not list are ignored. `infoLink` is optional: when it is an `http` or `https` address it becomes the "More information" link. |
| What is left out | A property needs a number in at least one row, and a row needs a number for at least one property. |

### Skewed data

One very large number (say India's population) uses up the whole colour range, so most countries look alike. Give the
property a `scale` to fix that. Each property has its own, so one file can use all three.

```json
{ "name": "Population (millions)", "color": "#d55e00", "scale": "quantile", "classes": 5 }
{ "name": "GDP (bn)", "color": "#1a73e8", "scale": "log" }
{ "name": "Literacy rate (%)", "color": "#009e73", "min": 50, "max": 100 }
```

| Option | What it does |
|---|---|
| `scale: 'linear'` | The default. Shades are proportional to the number. |
| `scale: 'quantile'` | Splits the countries into classes with the same number of countries each, and gives each class a shade. Best for skewed data. The legend lists the classes with their ranges. |
| `scale: 'log'` | Shades by the logarithm of the number. For numbers that span orders of magnitude, such as population or GDP. All numbers must be above zero (or set `min` above zero). The legend says "Logarithmic scale". |
| `classes` | Quantile only: how many classes, from 2 to 9. Default 5. |
| `min`, `max` | Numbers below `min` get the lightest shade, numbers above `max` the darkest. The legend marks the ends as "≤" and "≥". The card still shows the real numbers. Works with every scale. |

| Linear (default) | Quantile |
|---|---|
| ![Population on a linear scale: India stands out, everyone else is pale](https://raw.githubusercontent.com/amittkSharma/react-world-map-extended/main/docs/images/scale-linear.png) | ![The same population on a quantile scale: every class has its own shade](https://raw.githubusercontent.com/amittkSharma/react-world-map-extended/main/docs/images/scale-quantile.png) |

Options that cannot be used (an unknown scale, `classes` out of range, `min` not below `max`, a log scale with a zero) are
reported to `onDataIssues` and replaced by the default: the property keeps working as a linear one.

A number that sits exactly on the border between two quantile classes belongs to the higher class.

**If there are mistakes,** the map keeps working. The bad parts are left out, and you are told what was wrong. If nothing
usable is left, the data is ignored and the normal map stays. You do not need to wrap your data in `useMemo`.

![Mistakes in the data, reported to your code](https://raw.githubusercontent.com/amittkSharma/react-world-map-extended/main/docs/images/invalid-data.png)

Things to know:

- Northern Cyprus and Somaliland have no country code, so they can never have data. The codes `CYP` and `SOM` mean
  Cyprus and Somalia.
- When only your data is shown, the "Information on click" radio buttons are hidden, because they describe the
  built-in facts.
- `onCountryClick` gets your values (merged over the built-in facts for `'both'`).
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

`useWorldMapModes` remembers the visitor's choices (colour mode, information mode and the data property) and hands the
same ones to both components, so they stay in sync. It starts in Black and White, so pass `defaultColorMode: 'Colorful'`
when your own data colours the map.

With your own data and two or more properties, tell the controls their names to get the dropdown:
`<WorldMapControls {...modes} properties={data.properties.map((p) => p.name)} />`.

**`<WorldMapControls>` settings**

| Setting | What it does | Default |
|---|---|---|
| `colorMode`, `onColorModeChange` | The chosen colour mode and what happens when it changes. | – |
| `infoMode`, `onInfoModeChange` | The chosen amount of information and what happens when it changes. | – |
| `orientation` | `'horizontal'` or `'vertical'` (stacked, good for sidebars). | `'horizontal'` |
| `showInfoModes` | Set to `false` to hide the "Information on click" group (useful with your own data). | `true` |
| `properties` | The names of your data's properties. With two or more, a "Show on map" dropdown appears. | none |
| `dataProperty`, `onDataPropertyChange` | The chosen property and what happens when it changes. | the first property |
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
| `useWorldMapModes(options?)` | Remembers colour mode, information mode and the data property, ready to spread onto the map and the controls. Options: `defaultColorMode`, `defaultInfoMode`, `defaultDataProperty`. |

**Helpers**

| Name | What it does |
|---|---|
| `validateCountryData(data)` | Checks your data without drawing anything. Returns `{ properties, rows, issues }`: the usable properties (with their lowest and highest number), the valid rows and a list of what was wrong. Handy in a test. |
| `resolveCountryCode(text)` | Turns `'fra'`, `'FR'` or `' FRA '` into `'FR'`, or `undefined` if it is not a country. |
| `getCountryDetail(code, infoMode, getInfoLink?)` | Looks up the built-in facts of one country. |
| `getWikipediaUrl(code, name)` | The default "More information" link, in case you want to reuse it. |
| `COUNTRY_DATA_LIMITS` | The size limits for your data (500 rows, 50 properties, 2000 characters for a link). |
| `MAX_SELECTED_COUNTRIES` | The most countries that can be selected (5). |
| `MapColorOptions`, `MapDataOptions` | Named values for the colour and information modes. |

**Types:** `MapColorMode`, `MapInfoMode`, `MapPalette`, `CountryColors`, `LegendPosition`, `CountryDetail`,
`InfoLinkResolver`, `DetailsOptions`, `DetailsPosition`, `DetailsSource`, `HeadingLevel`, `CountryData`,
`CountryDataProperty`, `ScaleKind`, `CountryDataRow`, `CountryDataValues`, `CountryDataIssue`, `ValidatedCountryData`, `ValidatedProperty`, `CountryClickInfo`, `CountryClickContext`, `CountrySelection`,
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

- **Own data is numbers only.** The card lists them as plain label and value pairs: no grouping, units or number
  formatting (put the unit in the property's name, like `Literacy rate (%)`).
- **Quantile classes** show only as many shades as there are different numbers, so a property with few different
  values may have fewer classes than you asked for.
- **One colour per property.** Data that goes both ways (profit and loss) and text categories cannot be coloured yet.
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
npm run lint:fix       # fix formatting, import order and safe lint issues
```

## License

MIT
