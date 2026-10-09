# Configurable selection limit, table view and comparison

## Goal

Remove the rigid 5-country limit. Let users choose how many countries can be selected. When many are
selected, show their details as a comparable table instead of an accordion.

## Decisions (agreed)

- The default limit stays **5**, so existing users see no change.
- The table is used once the selection reaches `tableFrom` (default **6**), independent of the limit.
- The toast stays only for a finite limit being reached, or a controlled array being cut to the limit.
- Comparison = sortable columns plus highest/lowest markers in numeric columns. No charts, export or diffs.

## 1. Configurable limit

- New prop `maxSelected?: number`, default `MAX_SELECTED_COUNTRIES` (5). `Infinity` means unlimited.
  Anything that is not a number, is `NaN` or is below 1 falls back to the default; fractions are floored.
- `MAX_SELECTED_COUNTRIES` stays exported (now documented as the default).
- `useCountrySelection` receives `max` as an option; `MAX` module constant and the message strings become
  functions of `max`.
- Messages: finite → "n of max selected", "You can select up to {max} countries. Deselect one to add
  another."; `Infinity` → "n selected", no limit toast.
- If `maxSelected` drops below the current selection (uncontrolled), the selection is kept and only new
  additions are blocked; nothing is removed on the user's behalf.
- A controlled `selectedCountries` longer than `max` is truncated to the first `max` and toasts, as today.
- A blocked click still never reaches `onSelectionChange`; a controlled array is never written back.
- `CountryDetailsList`/`CountryDetails` copy ("select up to 5 countries") uses the real limit.

## 2. Table view

- New prop `tableFrom?: number`, default 6 (same sanitising as `maxSelected`, minimum 2).
- `selections.length >= tableFrom` renders `CountryDetailsTable` in the slot where `CountryDetailsList`
  renders now, inside the same `DetailsShell` (Clear all, Hide, overlay/sideways layouts unchanged).
- Rows: one per selected country, in selection order. Name cell links to `infoLink` when present.
- Columns: built-in facts present for the current `infoMode` and `source`, then the custom data
  properties (union across rows, first-seen order). `infoLink` is not a column. Missing value → "—".
- The country column stays sticky on the left so rows stay identifiable when the table scrolls sideways.
- Map link: `highlightCode` highlights the row; row hover/focus calls `onLink`; `reveal` scrolls the row
  into view. Each row has a remove button.
- `labels` and `formatValue` move from `SelectionBody.tsx` to `lib/` and are shared by card and table.

## 3. Comparison

- Pure module `lib/comparisonTable.ts`: `buildColumns`, `sortRows`, `findExtremes`.
- Sort: header button cycles ascending → descending → original order. View-only; selection order is
  unchanged. Numbers sort numerically, text with `localeCompare`, missing values always last.
- Extremes: a column gets markers only if it has at least 2 non-empty values and all of them are numbers.
  Highest and lowest cells show a ▲/▼ marker with visually hidden text ("highest"/"lowest").

## 4. Accessibility

Real `<table>` with caption ("Selected countries"), `scope` on headers, `aria-sort` on the sorted header,
scroll container with `tabIndex=0`, `role="region"` and a label. Marker meaning is never colour-only.

## 5. Tests (vitest, `tests/`)

- `selection`/`multiselect`: custom `maxSelected`, `Infinity` (no toast), invalid values, controlled
  array longer than the limit.
- `comparisonTable.test.ts`: columns, sort order incl. missing values, extremes rules.
- `detailsTable.test.tsx`: accordion below `tableFrom`, table at it, row highlight from the map, sort,
  remove, markers.

## 6. Docs

README props table and export list, JSDoc on the new props, `docs/ARCHITECTURE.md` (selection limit
section and file list). `schema/` only describes country data, so it is untouched.

## Out of scope

Charts, export, per-column visibility, persisting sort, virtualised rows.
