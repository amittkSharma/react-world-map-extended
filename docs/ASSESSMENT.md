# react-world-map-extended: what is left to do

Last updated 2026-10-09, after the configurable selection limit, the comparison table for many countries and the scale options for skewed data.

Finished features are not listed here. To see what the package can do, read the README. This file only keeps three things: where we stand, what is still open, and what could go wrong.

## 1. Where we stand

The package is a React map of the world. It is built on top of a smaller library called `react-svg-worldmap`, and it uses `i18n-iso-countries-extended-info` for country facts (capital, currency, language).

| What | State today |
|---|---|
| Automated checks | Lint (which also checks formatting and import order) has zero warnings. Type checks pass. 479 tests pass. |
| Package size | Our own code was 86.4 kB (20.9 kB when compressed) before the table; the built ESM file is now 103.5 kB (24.9 kB compressed), measured the same simple way as the build output. The download size was not measured again. The download is 63.4 kB in 8 files: the built code, one bundled set of types, the schema, README, licence and package.json. |
| Package format | Works as ESM and CommonJS and ships its types. The package checker finds no problems with the main entry (it complains about the JSON schema file entry only, because a JSON file has no types; Node and TypeScript can still import it). Sources, tests and docs are not in the download. |
| Build on GitHub (CI) | The workflow file exists but has **never run**. |
| Testing in a real browser | Only automated tests and screenshots with scripted clicks. **No person has used it with a real mouse, keyboard, touch screen or screen reader.** |
| Release | Version is `0.0.0`. Nothing is published. The data-driven colour map and the selection limit and table work are **not committed** to git yet (earlier work is). |

Where the code lives, and how it fits together: `docs/ARCHITECTURE.md`.

## 2. How much is it worth? (short version)

- The code quality is high for a small package. It is well tested and its behaviour is carefully thought through.
- The feature most people want from a world map, colouring it with **your own data**, now exists (section 5). It has only been tried by us, not by anyone else.
- Expect a small audience. The library underneath has about 36,000 downloads a week. A similar package, `react-simple-maps`, has about 1.2 million. Our related package `i18n-iso-countries-extended-info` has 7.
- Many features were added without any outside user. Publishing a first version and listening is now more valuable than adding another option.

## 3. Decisions waiting for you

1. **Should `infoLink` appear in every information mode?** Today it appears in all of them, even "Only Name". The other option is to show it only in "Complete Information". It is a one-line change.
2. **What to do with the region colour scheme (finding C8).** The nine regions come from the data source and look uneven. Options: (1) keep it; (2) keep it but remove its legend (about 10 minutes); (3) replace it with a standard list such as the UN or World Bank regions (about 3 to 4 hours, recommended if you keep the scheme).
3. **Which version of `react-svg-worldmap` to use.** We use `2.0.2`. The newest is `2.1.0`. Decide after the check in step 5 of the release plan.
4. **The first version number.** The release tool can set it, for example `npm run release -- --release-as 0.1.0`.

5. **Should the table be reachable by default?** The default limit is 5 and the table starts at 6, so a visitor who changes nothing never sees it. It appears only when a site sets `maxSelected` above 5 (or passes a longer `selectedCountries` together with it). Options: (1) keep it, nothing changes for existing users (today); (2) set `tableFrom` to 4 or 5 so the table is the default view of a full selection; (3) raise the default limit. Option 1 is the safest for a first release.

Already decided: while a country is selected it is drawn last, so keyboard Tab reaches it last. We keep this.

## 4. Plan

### A. Get ready to release (next, about 1 to 2 days)

1. **Commit** the work to git in sensible pieces (about 30 minutes).
2. **Try it yourself in a real browser** (about 30 minutes): clicking, Shift+click, keyboard, the overlay, clicking away, the links.
3. **Add automatic real-browser tests** to the GitHub build (about 1 to 2 days). They would catch problems that the current tests cannot see: how things look and how a real mouse, keyboard and touch behave. See finding C16.
4. **Run the GitHub build** and fix what it finds (about 1 hour).
5. **Check the new library version** `2.1.0`. Our code relies on how that library builds its page (see Risks), so a new version can break it (about 2 hours).
6. **Make it look ready.** The README is rewritten in plain language with 6 screenshots (done). Still open: push the commit so the screenshot links work (C29), a live demo page, a repository description, and the same author and licence name everywhere. Right now `LICENSE` says "Amit Sharma" and `package.json` says "Amitt K Sharma" (about 2 hours).
7. **Publish `0.1.0`** as experimental. Add release notes that mention the change from `selectedCountry` to `selectedCountries` (finding C20).

### B. Make the data map better (after the first release and some feedback)

See section 5: outliers, text categories, the tooltip.

### C. Polish (about 2 to 3 days)

1. Test with a real screen reader. Announcements and the colour legend need a real check.
2. Keep a right-hand card close to a map that is narrower than its largest size (`size="responsive"`).
3. Let websites restyle the radio buttons: add class names, use fewer inline styles (C4).
4. Let websites change the texts (C5).
5. Always remove the library's extra margin around the map, not only when a card or legend is shown (C6).
6. Decide what should happen when several maps are on one page (C7).
7. Act on decision 3 about the region colour scheme (C8).
8. Check very small phones (under 400 px wide) and very large screens (C14).
9. Decide about the page jumping when the card appears (C13), and try the keyboard focus ring in Chrome, Firefox and Safari (C15).
10. Add an easy way to clear a multi-selection without the details card (C21).
11. Housekeeping: a size limit check in the build, and review the type workaround (C11, C12).

### D. Ideas for later

Charts, export and per-column choice for the comparison table. Zoom and "focus on a region". A search box for countries. Translations. Extra country facts from your own data source. More colour-blind-friendly colours. Export the map as an image. A documentation site.

### What "done" means for version 1.0.0

Automatic real-browser tests in the GitHub build. Tests cover at least 80% of the logic (not measured yet). The GitHub build passes (never run so far). The README has a demo and screenshots. A release is made with the release tool. The package size is written down. The data-driven map has been tried by someone who is not us.

## 5. Your own data: what is done and what is left

**Done.** You pass an object with two lists. `properties` is a list of `{ name, color }`. `countries` is a list of rows: a country code and a number per property. The map then:

- shades every country from a light tint (lowest number) to the property's colour (highest number);
- paints countries without a number grey;
- shows a legend with the property name, both ends of the scale and "No data";
- shows a "Show on map" dropdown when there are two or more properties, and recolours straight away when it changes (it can also be controlled from outside);
- shows your properties in the details card, labelled exactly as named, the chosen one first;
- handles skewed numbers: each property can use a `linear`, `quantile` or `log` scale and can cut the ends with `min` and `max`. The legend follows the scale (a bar, or the list of classes).

The data is checked against a schema. Mistakes are reported and the valid parts still work. Details are in the README.

**What we decided on the way**

- Countries are matched by ISO two-letter or three-letter code only. Names are not accepted.
- The colour belongs to the property, not to the country row. A fixed colour per row could not follow the dropdown.
- The built-in continent and region legend is never shown with your data. Only the colour scale legend is.
- The map starts colourful when your data is given. Fading the other countries is off by default with your data, because fading changes the shades.
- Only numbers (or `null`) are values. Text categories are not supported.
- The lowest value is a light tint (25% of the colour), not white, so it stays apart from the grey of "no data".
- Skewed data is solved per property, with an option, not automatically. `linear` stays the default because it is predictable. A bad option is reported and the property falls back to linear.
- A bad property, row or value is left out and reported. It never stops the map. If nothing usable is left, the normal map stays.

**What could come next**

1. **Value in the tooltip** (for example "France: 99"). Today it shows only the country name.
2. **Text categories and data that goes both ways** (two colours).
3. **A file picker for visitors** (read in their own browser, never sent anywhere). CSV or only JSON?
4. **Colours that colour-blind people can tell apart.** One colour from light to dark is a good start, but the colour is chosen by the data author.

## 5b. Many countries: what is done and what is left

**Done.** The limit of 5 countries is no longer fixed.

- `maxSelected` sets the limit: a whole number from 1, or `Infinity`. The default stays 5, so nothing changes for existing users. A bad value (0, negative, `NaN`, text) falls back to 5.
- The message "You can select up to N countries" only appears when a finite limit blocks a click, or when a controlled `selectedCountries` is longer than the limit (it is cut to the limit). With `Infinity` there is no message and the counter reads "n selected".
- Lowering the limit while countries are selected keeps them and only blocks new ones. A blocked click never reaches `onSelectionChange`.
- `tableFrom` (default 6, minimum 2) decides when the details become a table instead of the list. The table has one row per country and one column per fact and per property of your own data, a sticky country column, row highlight both ways with the map, a remove button per row, and "Clear all" and "Hide" as in the list.
- Comparison: click a header to sort (ascending, descending, back to the selection order). The highest and lowest value of a numeric column are marked with a symbol and hidden text. Missing values come last and show "—".
- Shared parts: `lib/detailFormat.ts` (labels and text of the facts, used by the card and the table), `SelectionBar` (head of the list and the table), `lib/comparisonTable.ts` (all table rules as pure functions).
- Checked with 26 new automatic tests (the limit, the switch to the table, sorting, marks, highlight, removal, and the pure table rules), plus lint, types and build.

**What we decided on the way**

- The table starts at `tableFrom`, not at "more than the default limit", so it works with any limit.
- Sorting changes only what you see, never the selection order.
- Marks only appear when they mean something: at least two values, all numbers, not all equal. `null` counts as empty, not zero.
- Columns for a built-in fact and a property of your own data with the same name stay separate.
- Not built: charts, export, choosing columns, remembering the sort, long-list tricks (virtual scrolling).

## 6. Open problems

Severity means how much it matters: High, Medium or Low. "Info" means it is only worth knowing.

| ID | Problem | Severity |
|---|---|---|
| B11 | Not ours to fix: the library `react-svg-worldmap` triggers a type error (`Cannot find namespace 'JSX'`) for people who turn off `skipLibCheck` and use `@types/react` 19. | Info |
| C1 | Nobody has checked accessibility with a real browser or screen reader. Colour alone carries meaning in the default and custom colour modes. Only the continent and region colour schemes and the colour scale of your own data have a legend. | Medium |
| C2 | Northern Cyprus and Somaliland have no standard country code. They stay white in colour mode and give no details when clicked, and they can never have data of your own (this is in the README). The codes `CYP` and `SOM` in your data mean Cyprus and Somalia, as in ISO. They do get the normal tooltip. | Low |
| C3 | Hovering the selected country makes its outline thinner, because the library's own hover style wins (this is in the README). | Low |
| C4 | The radio buttons can only be partly restyled from outside. The bar can change direction, but the groups, labels and inputs have no class names and use inline styles, so a website's CSS cannot override them without `!important`. | Low |
| C5 | Many texts cannot be changed or translated: the radio button labels, the "Show on map" dropdown title, the legend's "No data" and its screen-reader sentence ("from 80 to 99, light to dark"), the card headings and field names, "Selected countries", "Clear all", "Select multiple", the limit message, the screen-reader announcements, and the texts for your own data ("Data", "No data", "No custom data for X"). This must be solved before any translation work. | Medium |
| C6 | The library puts a 40 px margin around the map. We remove it only when a details card or a legend is shown. Without it the layout differs, and in narrow spaces the map may overflow. This comes from reading the code, not from a screenshot. | Medium |
| C7 | With several maps on one page, clicking the card or controls of one map does not clear the selection of another. Probably fine, but not tested or written down. | Low |
| C8 | The region colour scheme and its legend are questionable. The groups come from the data source: "Asia" is only the two Koreas, "Caribbean" is only the Bahamas, "South Atlantic Ocean" is only the Falklands, Israel, Turkey and Cyprus count as Europe, and Mexico counts as Latin America. See decision 3. | Medium |
| C9 | The built-in legend only appears for two colour schemes (your own data has its own scale legend). Its colour squares stay at full strength while other countries are faded. Its text cannot be changed. The point where it moves under a small map (520 px) was chosen by eye and checked at only a few widths. | Low |
| C10 | The tooltip fix has two edges: (a) before the page finishes loading in the browser, a second plain tooltip can still show for a moment; (b) it needs every drawn area to have an entry in the internal map data (this is unrelated to your own data, which does not change it). | Low |
| C11 | A type workaround: two area codes (`CYP`, `SOM`) are forced into a type that does not list them. It works today, but a library update could break it. | Low |
| C12 | The package keeps growing: our code is 20.9 kB compressed (it was 8.9 at the start). The download is smaller now (63.4 kB in 8 files, from 98.6 kB in 62) because the types are bundled into one file and the internals are no longer shipped. We still need a size limit in the build before version 1.0. | Low |
| C13 | With the card above or below the map, the page below it jumps when a country is selected or cleared. Cards on the side or in the overlay do not do this. | Low |
| C14 | Sizes where the layout switches (card to the top or bottom below 720 px, legend under the map below 520 px) were chosen by eye and only checked at a few widths. Phones under 400 px and very large screens were not checked. | Low |
| C15 | The keyboard focus ring is custom and nobody has tried it by hand. It is mostly a glow, which older Safari versions may not show. Only scripted keyboard events were tested. | Low |
| C16 | Visual mistakes are only found by a person. The black box around countries and the misplaced legend both reached you before any test noticed. We need automatic real-browser tests (step A3). | Medium |
| C17 | Multi-select and the overlay position do not work well together. The first selection opens the card over the map, which blocks it, so you must close the card before adding the next country (this is in the README). | Low |
| C18 | Multi-select was only tested with scripted clicks. Real Shift+click, the touch switch (read once when the page loads, and only shown on touch-first devices), the position of the message, quick repeated clicks with a slow-updating parent, and screen readers have not been tried by a person. | Medium |
| C19 | The list choices have not been tried with real users. Adding a country opens it and closes the older ones (on purpose, to keep the list short, and you can still open several by hand). A side-by-side table now exists, but only from `tableFrom` countries (6 by default), so with the default limit nobody sees it (see decision 5 and C41). After clearing, the first click replaces instead of adds. | Low |
| C20 | Two things changed in a way that is not backwards compatible: `selectedCountry` became `selectedCountries` (a list, and `onSelectionChange` gets a list), and `countryData` went from an array of rows to an object `{ properties, countries }`. Fine at version `0.0.0`, but both must appear in the first release notes. | Info |
| C21 | With two or more countries selected, clicking empty map no longer clears them. The only buttons for clearing ("Clear all" and the × on each entry) are in the details card. If the card is hidden or details are turned off, a mouse or touch user cannot clear the selection (they can only press Escape, Shift+click each selected country one by one, or click one other country to replace the whole selection). | Medium |
| C22 | The "Select multiple" switch appears on touch-first devices only. Laptops with a touch screen and a mouse will not get it, and the only other way to add a country is Shift, Cmd or Ctrl plus click. | Low |
| C23 | When the card has no scrolling area (for example the card is below the map) and a country far down the list is clicked, the page does not scroll to its entry. This was done on purpose, so that a click on the map never moves the page, but the user may not notice that the entry opened. | Low |
| C24 | **Your data is numbers only, shown as a plain list.** The card has no grouping, units or number formatting. Large numbers such as `83000000` are hard to read in the card (the legend does format them). Units must be part of the property name. | Low |
| C25 | **The schema is written twice** (a JSON Schema file and the checker in code). The JSON Schema cannot express some rules (the code must be a country on the map, no country twice, a property name used once and not `country` or `infoLink`, a number in at least one row for each property), so only the code checks them. A test makes both agree on everything the file can express, but a future rule must be added in both places. | Low |
| C26 | **The data is compared by content on every render** (turned into text to see whether it changed). That is cheap for normal data (up to 500 rows) but not free; very large data on a map that re-renders a lot (hover, focus) would cost a little each time. | Low |
| C27 | **Using names was refused on purpose, so rows with country names are all rejected.** People who only have names must convert them to codes first. There is no helper for that. | Low |
| C28 | The package checker complains about the JSON schema file entry (a JSON file has no types). It is harmless but noisy, and it is the only thing that keeps the checker from being a clean step in CI. | Low |
| C29 | **The README screenshots only show after the files are pushed to GitHub.** They are linked by their full GitHub address (so the npm page can show them too, because `docs/` is not in the download), and the files are not pushed yet, so today the images are broken everywhere except in a local file view. | Medium |
| C30 | **The screenshots are made by hand and will go out of date.** They come from the demo app in headless Chrome, cropped with a throw-away page. There is no script to make them again, so a later change to the look leaves the README showing the old one. The three data screenshots were retaken for the new format; the others were not affected. | Low |
| C31 | **The README hides some technical limits on purpose** (it should read well, and has no inner workings). The technical ones live here: the library's margin and tooltip changes (C6, C10), the drawing order and Tab order change, the focus ring and old Safari (C15), and the library's own hover style (C3). Check that nothing a user needs is missing from "Good to know". | Low |
| C33 | **The colour scale was only looked at with blue and orange.** The light end is 25% of the colour, chosen by eye. A grey or very light base colour would give a light end that looks like the grey of "No data", and nothing warns the user. Colour-blind safety depends on the colour the data author picks. | Medium |
| C34 | **The map starts colourful only until the visitor chooses.** This works when the data arrives late too, but `useWorldMapModes` always starts in Black and White, so people with separate controls must pass `defaultColorMode: 'Colorful'` (this is in the README). A hover tooltip still shows only the country name, not the value. | Low |
| C35 | **The data map was checked with automatic tests and Chrome screenshots only.** Real mouse use of the dropdown, keyboard use of the dropdown, a screen reader reading the legend sentence, and a very narrow phone (the legend becomes a strip under the map) have not been tried (see C1, C18). | Medium |
| C36 | **Nothing warns about skewed data.** A linear scale on skewed numbers still gives a pale map, and the only help is the README. We did not add an automatic hint, because the problem list (`onDataIssues`) is for mistakes and valid data would start to print warnings. | Low |
| C37 | **A number on the border of two quantile classes belongs to the higher class, but the legend writes both ends of a range** ("83.2 – 124.5", then "124.5 – 214.3"). It is written in the README only. Classes also have no names, and with few different numbers there are fewer classes than asked for. | Low |
| C38 | **The scales were checked with automatic tests and Chrome screenshots on one sample file.** Real data with many countries, ties, negative numbers and very small classes has not been tried by a person. The log scale and the "≤ / ≥" legend marks have no screenshot. | Medium |
| C39 | **The table was only checked with automatic tests (jsdom).** Nobody has seen it in a real browser: the sticky country column, the scroll area that takes keyboard focus, the sort buttons with a real keyboard, the marks read by a screen reader, and the row highlight with a real mouse. jsdom has no layout, so sticky and scrolling are not tested at all (see C1, C16, C18). | Medium |
| C40 | **The sticky country and remove cells have a solid background** (the card colour or the highlight colour). On the overlay card, which is slightly see-through, or on a card a site has restyled with its own background, the cell could show as a plain patch. Not seen yet, only reasoned from the code. | Medium |
| C41 | **The table is hidden by default.** The limit is 5 and the table starts at 6, so a site that changes nothing never gets it, and it is not obvious it exists (decision 5). Two to five countries only get the list, which cannot compare side by side. | Medium |
| C42 | **Highest and lowest are crude.** They ignore units and do not know whether high is good. A column that mixes numbers and text gets no marks. The dialling prefix is text, so it sorts as text ("+1, +44" before "+33"). Numbers are shown as written, with no thousands separators (as in C24). | Low |
| C43 | **More texts that cannot be changed or translated** (add to C5): "Country", "Selected countries, compared", the table caption, "highest/lowest in this column", "Remove X from the selection", and the column names of the facts. | Medium |
| C44 | **A very large selection** (`Infinity` and 100+ countries) gives a very long table and a busy map. It scrolls inside the card and renders fine, but there is no virtual scrolling and the only quick way back is "Clear all" (see C21). The rows are sorted again on every render, which is cheap for a few hundred rows but not free when hovering the map re-renders often. | Low |
| C45 | **Two views to keep in step.** Every new fact or kind of data must be handled by the list and by the table. The shared text code lowers the risk, but the list shows data as groups and the table as columns, so they can still drift (for example how `infoLink` or boolean values show). | Low |
| C46 | **The sort is forgotten** when the selection drops below `tableFrom` and the table disappears. Adding countries while sorted puts the new rows in sorted position, so the new country may not be where the eye expects it. The map click still scrolls to the row. | Low |
| C47 | **The limit logic has many branches** (finite or not, controlled or not, lowered while selected, blocked clicks, several quick clicks). Each has a test, but only with scripted clicks and a parent that re-renders at once (C18). | Low |
| C48 | **New public names**: `maxSelected`, `tableFrom` and the export `TABLE_FROM` are part of the API from the first release. Changing the table threshold rule or the meaning of `Infinity` later would break users. `CountryDetails` also got an optional `max`. Nothing existing changes by default. | Info |

## 7. Risks

- **The package depends on how another library builds its page.** We remove its margin, remove its second tooltip, copy its size presets, find countries by their text label, and override its focus style. A library update can break these without any warning. The check in step A5 and automatic real-browser tests are the protection.
- **Real use is untested.** Everything (including the new own-data feature) has been tested with automatic tests, screenshots or scripted clicks, not with real mouse, keyboard, touch or screen reader (C18).
- **Clicking away clears a one-country selection with a listener on the whole page.** Any click outside the map clears it unless you switch this off (`deselectOn="background"` or `"never"`). It relies on React updating the page before the click reaches the page listener. Only a simulating test covers this, not a real browser.
- **Multi-select touches many parts at once** (selection, highlighting, drawing order, focus, clicking away, Escape, the card, the overlay). Each rule has a test and was checked by breaking the code on purpose, but real-browser behaviour is unverified.
- **Two small outside packages are involved**, `react-svg-worldmap` and `i18n-iso-countries-extended-info`. If they stop being maintained, we may need to copy the few parts we use.
- **One security warning in the build tools.** `npm audit` reports 1 high-severity issue in `brace-expansion`. It only comes in through the release tool, which is used on your machine and not shipped. The warning is 0 for the code that users install.
- **One tooltip per country** was checked from the page's code and the library's source, not by hovering in a real browser.
- **The new table and limit are unverified in a real browser.** The risky parts are layout (sticky column, scroll area, overlay background) and keyboard and screen reader use of the sort buttons (C39, C40). Check them by hand, with a narrow card and 10 or more countries, before release.
- **Unlimited selection removes a safety rail.** `maxSelected={Infinity}` was a hard stop before. A site can now let visitors fill the card with hundreds of rows; the default (5) keeps the old behaviour.
- **Too many features, too few users.** Features keep being added without outside feedback. Release early, then decide from what people ask for.
- **If the library ever rebuilds its country shapes** (not seen so far), the selected country's outline could be partly covered until the next click.
