# Architecture and solution structure

This document is for people who work on the package. It is not part of the README and is not published to npm.

## 1. What the package is

`react-world-map-extended` wraps [`react-svg-worldmap`](https://github.com/ianwilliams/react-svg-worldmap) (the SVG map) and
`i18n-iso-countries-extended-info` (the built-in country facts), and adds:

- a details card for the selected country, and a list for up to five selected countries;
- the user's own data: validation, a colour scale per property, a legend and a property dropdown;
- keyboard and screen-reader support, and theming through CSS custom properties.

It is one public component (`ExtendedWorldMap`) plus a few building blocks (`WorldMapControls`, `CountryDetails`,
`CountryDetailsList`, `useWorldMapModes`, `validateCountryData`).

## 2. Layers

Dependencies point downwards only. A layer never imports from a layer above it.

```text
 index.tsx                      public API: re-exports only
     │
 ExtendedWorldMap.tsx           composition: props -> state -> one render
     │
 components/   hooks/           React: things that render, things that hold state or touch the DOM
     │             │
 lib/          styles/          plain TypeScript: no React state, easy to unit test
     │
 data/         constants.ts     static tables (colours, ISO code maps, option lists)
```

| Layer | Rule |
|---|---|
| `lib/` | Pure functions and types. No hooks, no `useState`. Everything with logic worth testing lives here. |
| `hooks/` | One concern per hook. A hook either owns state (`useCountrySelection`), or syncs with the DOM (`useMapBox`, `useRaiseOnTop`). |
| `components/` | Presentational. They get data and callbacks as props and decide nothing about the map's rules. |
| `styles/` | Style objects and CSS-variable tokens. Inline styles only (see section 7). |
| `ExtendedWorldMap.tsx` | The only place that knows how all the parts fit together. |

## 3. Folder structure

```text
src/
  index.tsx                 public exports
  ExtendedWorldMap.tsx      the component
  ExtendedWorldMapProps.ts  every public prop, with its documentation
  constants.ts              MapColorOptions / MapDataOptions and the option lists of the radio buttons
  types.ts                  shared small types (HeadingLevel, CardAppearance, LabelValue)

  components/
    CountryDetails.tsx      card for one country (or the "click a country" hint)
    CountryDetailsList.tsx  accordion for two or more countries
    DetailsListItem.tsx     one entry of that accordion
    DetailsShell.tsx        frame shared by both: live region, fonts, "Hide"
    DetailsSlot.tsx         where the card sits next to the map, or its "Show details" button
    SelectionBody.tsx       the facts and values inside a card (built-in facts, own values, link)
    ShowDetailsButton.tsx
    OverlayDialog.tsx       modal dialog that covers the map
    MapLegend.tsx           colour list or colour scale
    MapToast.tsx            short message over the map
    MultiSelectToggle.tsx   "Select multiple" switch for touch screens
    WorldMapControls.tsx    radio groups and property dropdown (usable on its own)
    RadioGroup.tsx  PropertySelect.tsx

  hooks/
    useCountrySelection     the selected countries, the limit, messages, reveal requests
    useOwnData              own data as the map uses it: rows, source, properties, chosen property
    useCountryData          validates the data when its content changes, reports problems once
    useDeselect             click-away and Escape
    useCountryPointer       keyboard focus and pointer position on countries
    useAccordion            which entries of the list are open
    useMapBox               measures the real <svg> so cards and overlays line up with it
    useRaiseOnTop           draws selected countries last (SVG has no z-index)
    useSingleTooltip        removes the library's second, plain tooltip
    useModalDialog          focus handling of the overlay, and `inert` for the map behind it
    useControllableState    controlled / uncontrolled pattern for every `x` / `defaultX` / `onXChange`
    useWorldMapModes        state of the controls, for use outside the map
    useCoarsePointer  useIsomorphicLayoutEffect

  lib/
    countryData.ts          schema and validator of the user's data
    colorScale.ts           number -> shade of a colour; number formatting
    cardSelections.ts       what each card shows, and what `onCountryClick` reports
    countryStyle.ts         the style of every country on the map
    mapLegend.ts            what the legend says
    detailsLayout.ts        where the card goes (and when it moves above/below)
    palettes.ts             built-in colour schemes and their legends
    countryDetail.ts        built-in facts of a country, and the default info link
    countries.ts            names <-> ISO codes of the map, names that get the styled tooltip
    corner.ts  mapSize.ts  headings.ts  webUrl.ts  scrollIntoCard.ts  classNames.ts
    inputModality.ts        keyboard or pointer used last (page-wide)
    selectionLimit.ts       MAX_SELECTED_COUNTRIES

  data/
    alpha3.ts               ISO alpha-3 -> alpha-2
    defaultMapData.ts       colour per country, and the data the library needs for its tooltips

  styles/
    mapStyles.ts            country states (selected, dimmed, focused, no data, ...)
    detailsStyles.ts        card and list

schema/country-data.schema.json   JSON Schema of the user's data (published)
tests/                            Vitest + Testing Library, one file per concern
example/                          demo app (not published); query-string hooks in scenario.ts
docs/                             this file, the assessment, README images (not published)
```

## 4. How a render works

`ExtendedWorldMap` is a straight line from props to JSX:

```text
props
  ├─ useCountrySelection ───────────► selectedCodes, click(), remove(), clear(), toast, announcement
  ├─ useOwnData ────────────────────► rows, source, properties, active property, numberFor(code)
  ├─ useControllableState (x3) ─────► colour mode, info mode, card open
  │
  ├─ createCountryStyle(...) ───────► (country) => CSS       passed to the map as `styleFunction`
  ├─ buildMapLegend(...) ───────────► legend content
  ├─ buildSelections(...) ──────────► what each card shows
  ├─ resolvePosition / slotStyle ───► where the card goes
  │
  └─ JSX: controls · [card] · map · legend · toggle · toast · [overlay] · [card] · live region
```

Everything between "props" and "JSX" is either a hook (state) or a pure function in `lib/` (rules). The component
itself holds no rules.

### The map and its library

`react-svg-worldmap` draws the SVG. This package gives it one `styleFunction` and one `onClickFunction`. It never draws
countries itself. Everything it needs to know about the DOM the library produces is concentrated in four hooks and one
helper (see section 8).

### Controlled and uncontrolled state

Every state a consumer may want to own follows one pattern, implemented once in `useControllableState`:
`value` (controlled) / `defaultValue` (starting value) / `onChange`. It applies to the selection, the colour mode, the info
mode, the open card and the data property.

## 5. The selection model

`useCountrySelection` is the only owner of "which countries are selected" and everything that changes it:

- A plain click replaces the selection. Shift, Cmd or Ctrl (or the toggle on touch screens) adds or removes.
- At most `MAX_SELECTED_COUNTRIES` (5). A blocked click shows a toast and never reaches `onSelectionChange`.
- A controlled array is normalised (upper-case, known codes, no duplicates). If it is too long, the first five are used and
  a toast says so. The array is never written back.
- It keeps the latest value in a ref, because several clicks can arrive before the next render.
- It also produces the text for screen readers ("Germany added, 2 of 5 selected") and the "reveal" request that tells the
  list which entry to open.

Clearing is in `useDeselect`: a click away clears a selection of one country (never a larger one), Escape clears any
selection. The overlay dialog stops its own Escape so that Escape there only closes the card.

## 6. Own data: from JSON to pixels

```text
countryData (object)
   │  useCountryData         compares by content (JSON text), so inline objects do not re-run it
   ▼
validateCountryData          lib/countryData.ts: properties, rows, issues; nothing throws
   │  issues ──► onDataIssues (or console.warn), once per distinct content
   ▼
useOwnData                   rows, source ('custom' | 'both' | 'default'), properties, chosen property
   │
   ├─► createCountryStyle    numberFor(code) -> scaleColor(property, number) -> fill; no number -> grey
   ├─► buildMapLegend        gradient (name, lowest, highest) + "No data"
   ├─► WorldMapControls      "Show on map" dropdown when there are two or more properties
   └─► buildSelections       values in the cards, the chosen property first
```

Rules that shape the code:

- Data is matched by ISO alpha-2 or alpha-3 code only, never by name (names differ between languages).
- The colour belongs to the property, not to the country row, so the dropdown can recolour the map.
- Invalid parts are left out and reported. If no property is usable, the data is ignored and the built-in facts stay.
- With own data, the built-in legend never shows and other countries are not faded by default (the shades carry meaning).
- The same schema exists twice: `schema/country-data.schema.json` (for editors) and `validateCountryData` (for the
  runtime). A test checks that they agree on everything the JSON Schema can express. A new rule must be added to both.

## 7. Styling

- All visual state is expressed as inline styles built in `styles/` and `lib/countryStyle.ts`. The reason is that the
  package ships no CSS file: nothing to import, nothing to purge, and styles apply inside the library's SVG.
- Colours are CSS custom properties with defaults (`var(--rwme-stroke, #000)`), so consumers theme from outside.
  The tokens are listed in the README.
- Borders are written with longhand properties only. Mixing `border` and `borderLeft` while a card changes state makes
  React warn.
- Class names (`rwme-*`) exist as hooks for tests and for consumers; they carry no styles.

## 8. Coupling to `react-svg-worldmap`

These are the places where the package depends on how the library builds its page. A library update can break them,
so they are isolated and covered by tests:

| What | Where |
|---|---|
| Countries are `<path aria-label="Name">` | `useCountryPointer`, `useRaiseOnTop`, `useDeselect`, `lib/countries.ts` |
| Each country has an extra `<title>` that makes a second tooltip | `useSingleTooltip` |
| A `<figure>` with a 40 px margin around the `<svg>` | `useMapBox` |
| Size presets (240, 336, 480, 640, 1200 px) | `lib/mapSize.ts` |
| The library restyles hover and focus (border width, opacity) | `styles/mapStyles.ts` (the glow) |
| Every drawn area needs a `data` entry to get the styled tooltip | `data/defaultMapData.ts` |

The version is pinned exactly in `package.json`.

## 9. Accessibility

- The card is a polite live region. In the overlay the dialog is the named container and the card inside is only a polite
  area, so nothing is announced twice.
- The overlay is a real modal: focus moves in, Tab stays inside, Escape closes it, focus returns, and the map behind is
  `inert`.
- Keyboard focus on a country is drawn by the package (a glow along the outline), never by the browser's box. It is shown
  only when the keyboard was used last (`lib/inputModality.ts`).
- Selection changes made by clicking are announced; the toast is a status region.
- The legend's scale has a text equivalent ("Literacy rate (%): from 80 to 99, light to dark").

## 10. Tests

Vitest with jsdom and Testing Library. Tests go through the public API (`import ... from '../src'`) so refactors do not
break them. Only pure modules are imported directly (`lib/countryData`, `lib/colorScale`, `lib/palettes`, `lib/countryDetail`, `data/defaultMapData`, `constants`).

| Concern | Files |
|---|---|
| Own data: validation, schema, scale, dropdown, legend | `countryData`, `colorScale`, `customData` |
| Selection and cards | `selection`, `multiselect`, `details`, `detailsList` |
| Clearing | `deselect`, `escape` |
| Look and feedback | `dimming`, `focus`, `legend`, `tooltip` |
| Controls and general behaviour | `controls`, `features`, `ExtendedWorldMap`, `getCountryDetail`, `palettes` |

`tests/helpers.ts` holds the helpers shared by the tests. The tests check behaviour. A rule worth keeping should also
survive a deliberate mutation of the code (break it on purpose and see that a test fails).

What the tests cannot see: real layout, real mouse and keyboard timing, touch, and screen readers. See
`ASSESSMENT.md` for the list of known gaps.

## 11. Build, quality gates and publishing

| Step | Command | What it does |
|---|---|---|
| Check | `npm run lint` | Biome: lint, formatting and import order; any warning fails |
| Types | `npm run typecheck` | `src`, `tests` and `example` |
| Test | `npm test` | Vitest |
| Build | `npm run build` | rslib: ESM + CJS, and one bundled `.d.ts` / `.d.cts` |
| Everything | `npm run build-package` | the four steps above; also runs before `npm publish` (`prepublishOnly`) |
| Release | `npm run release` | version and changelog from commit messages |

What is published (8 files): `dist/index.js`, `index.cjs`, `index.d.ts`, `index.d.cts`, `schema/country-data.schema.json`,
`README.md`, `LICENSE`, `package.json`. The `files` field in `package.json` is the allow-list; `.npmignore` repeats it
as a second guard. Sources, tests, docs, the example and all configuration stay out. The type declarations are bundled
into one file, so internal modules are not published.

`react` and `react-dom` are peer dependencies (`react-dom` optional); `react-svg-worldmap` and
`i18n-iso-countries-extended-info` are dependencies and are not bundled.

## 12. Where to change what

| I want to... | Change |
|---|---|
| add a prop | `ExtendedWorldMapProps.ts` (with its documentation), use it in `ExtendedWorldMap.tsx`, document it in the README |
| change how countries look | `styles/mapStyles.ts` or `lib/countryStyle.ts` |
| add a rule for own data | `lib/countryData.ts` **and** `schema/country-data.schema.json`, then the tests |
| add a colour scheme | `lib/palettes.ts` |
| change what the cards show | `components/SelectionBody.tsx` (layout) or `lib/cardSelections.ts` (content) |
| change selection rules | `hooks/useCountrySelection.ts` |
| support a new version of the map library | section 8 lists everything to check |
