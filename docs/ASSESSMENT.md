# react-world-map-extended: what is left to do

Last updated 2026-10-08, after the custom data feature and the README rewrite.

Finished features are not listed here. To see what the package can do, read the README. This file only keeps three things: where we stand, what is still open, and what could go wrong.

## 1. Where we stand

The package is a React map of the world. It is built on top of a smaller library called `react-svg-worldmap`, and it uses `i18n-iso-countries-extended-info` for country facts (capital, currency, language).

| What | State today |
|---|---|
| Automated checks | Lint has zero warnings. Type checks pass. 346 tests pass. |
| Package size | Our own code is 77.8 kB (18.1 kB when compressed). The download is 98.6 kB in 62 files. |
| Package format | Works as ESM and CommonJS and ships its types. The package checker finds no problems with the main entry (it complains about the JSON schema file entry only, because a JSON file has no types; Node and TypeScript can still import it). |
| Build on GitHub (CI) | The workflow file exists but has **never run**. |
| Testing in a real browser | Only automated tests and screenshots with scripted clicks. **No person has used it with a real mouse, keyboard, touch screen or screen reader.** |
| Release | Version is `0.0.0`. Nothing is published. The latest work is **not committed** to git. |

Where the code lives:

```text
src/index.tsx                The main component (state and wiring)
src/useCountrySelection.ts   Which countries are selected, the limit of 5, messages
src/countryData.ts           Checks your own data against the schema (ISO codes only)
src/useCountryData.ts        Runs that check when the data changes and reports problems
src/rawData/alpha3.ts        Table of three-letter country codes
schema/                      The JSON Schema file for your own data
src/CountryDetails.tsx       Details card for one country
src/CountryDetailsList.tsx   Details list (accordion) for 2 or more countries
src/MapLegend.tsx            Legend on the map
src/MapToast.tsx             Small message in the map's top-right corner
src/MultiSelectToggle.tsx    "Select multiple" switch for touch screens
src/WorldMapControls.tsx     The radio buttons, usable on their own
src/useWorldMapModes.ts      Keeps the radio button choices in your own code
src/corner.ts                Places things in a corner of the map
src/countries.ts             Country codes and names
src/inputModality.ts         Knows whether you last used keyboard or mouse
src/useMapBox.ts             Measures where the map really is on the page
src/useModalDialog.ts        Overlay behaviour (focus, Escape)
src/useRaiseOnTop.ts         Draws selected countries on top of the others
src/useSingleTooltip.ts      Removes the library's second (duplicate) tooltip
src/palettes.ts              Colour schemes and their legends
docs/images/                 Screenshots used by the README (not part of the download)
example/                     Demo app; the URL options are listed in scenario.ts
```

## 2. How much is it worth? (short version)

- The code quality is high for a small package. It is well tested and its behaviour is carefully thought through.
- The biggest thing missing is the ability to colour the map with **your own data**. Most people who want a world map want exactly that. See section 5.
- Expect a small audience. The library underneath has about 36,000 downloads a week. A similar package, `react-simple-maps`, has about 1.2 million. Our related package `i18n-iso-countries-extended-info` has 7.
- Many features were added without any outside user. Publishing a first version and listening is now more valuable than adding another option.

## 3. Decisions waiting for you

1. **Colour the map by a value.** The first step (showing your own data in the details) is done. Next step: pick which numeric property colours the map, with a legend (section 5). The questions there need answers first.
2. **Should `infoLink` appear in every information mode?** Today it appears in all of them, even "Only Name". The other option is to show it only in "Complete Information". It is a one-line change.
3. **What to do with the region colour scheme (finding C8).** The nine regions come from the data source and look uneven. Options: (1) keep it; (2) keep it but remove its legend (about 10 minutes); (3) replace it with a standard list such as the UN or World Bank regions (about 3 to 4 hours, recommended if you keep the scheme).
4. **Which version of `react-svg-worldmap` to use.** We use `2.0.2`. The newest is `2.1.0`. Decide after the check in step 5 of the release plan.
5. **The first version number.** The release tool can set it, for example `npm run release -- --release-as 0.1.0`.

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

### B. Colour the map by your own data (about 3 to 4 days, after the questions are answered)

See section 5. Showing your own data in the details is already done.

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

A side-by-side comparison table for selected countries. Zoom and "focus on a region". A search box for countries. Translations. Extra country facts from your own data source. More colour-blind-friendly colours. Export the map as an image. A documentation site.

### What "done" means for version 1.0.0

Automatic real-browser tests in the GitHub build. Tests cover at least 80% of the logic (not measured yet). The GitHub build passes (never run so far). The README has a demo and screenshots. A release is made with the release tool. The package size is written down. The data-driven map is either built or clearly postponed.

## 5. Your own data: what is done and what is left

**Done.** You can pass a list of rows (a country code plus values) to the map. The details show those values instead of, or next to, the built-in facts. The data is checked against a schema; mistakes are reported and the valid rows still work. Countries without data are greyed out. Details are in the README.

**What we decided on the way**

- Countries are matched by ISO two-letter or three-letter code only. Names are not accepted (they differ between languages and spellings). The error message says so.
- The labels in the card are exactly the property names. The values are shown as given.
- By default only your data is shown once you pass it. `'both'` shows yours first and then the built-in facts.
- The radio buttons for the built-in facts are hidden when only your data is shown.
- A bad row or value is left out and reported. It never stops the map.

**What is left (the next step): colour the map by a value.** Open questions:

1. **Which property colours the map?** For example `colorBy="Literacy rate (%)"`. Should a visitor be able to switch between several numeric properties with a selector?
2. **What kind of colour scale?** A smooth scale from light to dark, steps (for example 0 to 25, 25 to 50, …), or categories (for text values)? What colour for missing data (today: grey)?
3. **The legend.** A gradient or steps, with the unit. It must replace the colour-scheme legend, not appear next to it.
4. **A file picker for visitors** (read in their own browser, never sent anywhere). Do we want it, and with CSV or only JSON?

**Things to keep in mind for that step**

- Colours that colour-blind people can tell apart.
- Colour alone is hard for some people to read: show the values in the card as well (already the case).
- Fading the other countries while one is selected would distort colours that carry meaning. There is already a switch to turn fading off.
- Disputed areas and areas with no ISO code (Kosovo is covered by `XK`; Northern Cyprus and Somaliland cannot have data).
- Sensitive data (such as crime figures) must stay in the visitor's browser.

## 6. Open problems

Severity means how much it matters: High, Medium or Low. "Info" means it is only worth knowing.

| ID | Problem | Severity |
|---|---|---|
| B11 | Not ours to fix: the library `react-svg-worldmap` triggers a type error (`Cannot find namespace 'JSX'`) for people who turn off `skipLibCheck` and use `@types/react` 19. | Info |
| C1 | Nobody has checked accessibility with a real browser or screen reader. Colour alone carries meaning in the default and custom colour modes. Only the continent and region colour schemes have a legend. | Medium |
| C2 | Northern Cyprus and Somaliland have no standard country code. They stay white in colour mode and give no details when clicked, and they can never have data of your own (this is in the README). The codes `CYP` and `SOM` in your data mean Cyprus and Somalia, as in ISO. They do get the normal tooltip. | Low |
| C3 | Hovering the selected country makes its outline thinner, because the library's own hover style wins (this is in the README). | Low |
| C4 | The radio buttons can only be partly restyled from outside. The bar can change direction, but the groups, labels and inputs have no class names and use inline styles, so a website's CSS cannot override them without `!important`. | Low |
| C5 | Many texts cannot be changed or translated: the radio button labels, the card headings and field names, "Selected countries", "Clear all", "Select multiple", the limit message, the screen-reader announcements, and the texts for your own data ("Data", "No data", "No custom data for X"). This must be solved before any translation work. | Medium |
| C6 | The library puts a 40 px margin around the map. We remove it only when a details card or a legend is shown. Without it the layout differs, and in narrow spaces the map may overflow. This comes from reading the code, not from a screenshot. | Medium |
| C7 | With several maps on one page, clicking the card or controls of one map does not clear the selection of another. Probably fine, but not tested or written down. | Low |
| C8 | The region colour scheme and its legend are questionable. The groups come from the data source: "Asia" is only the two Koreas, "Caribbean" is only the Bahamas, "South Atlantic Ocean" is only the Falklands, Israel, Turkey and Cyprus count as Europe, and Mexico counts as Latin America. See decision 3. | Medium |
| C9 | The legend only appears for two colour schemes. Its colour squares stay at full strength while other countries are faded. Its text cannot be changed. The point where it moves under a small map (520 px) was chosen by eye and checked at only a few widths. | Low |
| C10 | The tooltip fix has two edges: (a) before the page finishes loading in the browser, a second plain tooltip can still show for a moment; (b) it needs every drawn area to have an entry in the internal map data (this is unrelated to your own data, which does not change it). | Low |
| C11 | A type workaround: two area codes (`CYP`, `SOM`) are forced into a type that does not list them. It works today, but a library update could break it. | Low |
| C12 | The package is getting bigger. Our code grew from 8.9 to 18.1 kB compressed, and the download from 31.6 to 98.6 kB. The multi-select feature alone added about 4 kB and 14 files. This is fine now, but we need a size limit in the build before version 1.0. | Low |
| C13 | With the card above or below the map, the page below it jumps when a country is selected or cleared. Cards on the side or in the overlay do not do this. | Low |
| C14 | Sizes where the layout switches (card to the top or bottom below 720 px, legend under the map below 520 px) were chosen by eye and only checked at a few widths. Phones under 400 px and very large screens were not checked. | Low |
| C15 | The keyboard focus ring is custom and nobody has tried it by hand. It is mostly a glow, which older Safari versions may not show. Only scripted keyboard events were tested. | Low |
| C16 | Visual mistakes are only found by a person. The black box around countries and the misplaced legend both reached you before any test noticed. We need automatic real-browser tests (step A3). | Medium |
| C17 | Multi-select and the overlay position do not work well together. The first selection opens the card over the map, which blocks it, so you must close the card before adding the next country (this is in the README). | Low |
| C18 | Multi-select was only tested with scripted clicks. Real Shift+click, the touch switch (read once when the page loads, and only shown on touch-first devices), the position of the message, quick repeated clicks with a slow-updating parent, and screen readers have not been tried by a person. | Medium |
| C19 | The list choices have not been tried with real users. Adding a country opens it and closes the older ones (on purpose, to keep the list short, and you can still open several by hand). There is no side-by-side comparison, which is probably what people want. After clearing, the first click replaces instead of adds. | Low |
| C20 | The way to select countries changed (not backwards compatible): `selectedCountry` became `selectedCountries` (a list) and `onSelectionChange` now gets a list. This is fine at version `0.0.0`, but it must appear in the first release notes. | Info |
| C21 | With two or more countries selected, clicking empty map no longer clears them. The only buttons for clearing ("Clear all" and the × on each entry) are in the details card. If the card is hidden or details are turned off, a mouse or touch user cannot clear the selection (they can only press Escape, Shift+click each selected country one by one, or click one other country to replace the whole selection). | Medium |
| C22 | The "Select multiple" switch appears on touch-first devices only. Laptops with a touch screen and a mouse will not get it, and the only other way to add a country is Shift, Cmd or Ctrl plus click. | Low |
| C23 | When the card has no scrolling area (for example the card is below the map) and a country far down the list is clicked, the page does not scroll to its entry. This was done on purpose, so that a click on the map never moves the page, but the user may not notice that the entry opened. | Low |
| C24 | **Your own data is shown as a plain list.** There is no grouping, no units, no number formatting and no way to rename or order the labels apart from renaming the properties (labels are the property names, by design). Large numbers such as `83000000` are hard to read. | Low |
| C25 | **The schema is written twice** (a JSON Schema file and the checker in code). The JSON Schema cannot express two rules (the code must be a country on the map, and no country twice), so only the code checks them. A test makes both agree on everything the file can express, but a future rule must be added in both places. | Low |
| C26 | **The data is compared by content on every render** (turned into text to see whether it changed). That is cheap for normal data (up to 500 rows) but not free; very large data on a map that re-renders a lot (hover, focus) would cost a little each time. | Low |
| C27 | **Using names was refused on purpose, so rows with country names are all rejected.** People who only have names must convert them to codes first. There is no helper for that. | Low |
| C28 | **The size grew again:** our code is now 18.1 kB compressed (from 14.7) and the download 98.6 kB in 62 files. The package checker also complains about the JSON schema file entry (no types), which is harmless but noisy. | Low |
| C29 | **The README screenshots only show after the files are pushed to GitHub.** They are linked by their full GitHub address (so the npm page can show them too, because `docs/` is not in the download), and the files are not committed yet, so today the images are broken everywhere except in a local file view. | Medium |
| C30 | **The screenshots are made by hand and will go out of date.** They come from the demo app in headless Chrome, cropped with a throw-away page. There is no script to make them again, so a later change to the look leaves the README showing the old one. | Low |
| C31 | **The README now hides some limits on purpose** (it should read well, and has no inner workings). The technical ones live here: the library's margin and tooltip changes (C6, C10), the drawing order and Tab order change, the focus ring and old Safari (C15), and the library's own hover style (C3). Check that nothing a user needs is missing from "Good to know". | Low |

## 7. Risks

- **The package depends on how another library builds its page.** We remove its margin, remove its second tooltip, copy its size presets, find countries by their text label, and override its focus style. A library update can break these without any warning. The check in step A5 and automatic real-browser tests are the protection.
- **Real use is untested.** Everything (including the new own-data feature) has been tested with automatic tests, screenshots or scripted clicks, not with real mouse, keyboard, touch or screen reader (C18).
- **Clicking away clears a one-country selection with a listener on the whole page.** Any click outside the map clears it unless you switch this off (`deselectOn="background"` or `"never"`). It relies on React updating the page before the click reaches the page listener. Only a simulating test covers this, not a real browser.
- **Multi-select touches many parts at once** (selection, highlighting, drawing order, focus, clicking away, Escape, the card, the overlay). Each rule has a test and was checked by breaking the code on purpose, but real-browser behaviour is unverified.
- **Two small outside packages are involved**, `react-svg-worldmap` and `i18n-iso-countries-extended-info`. If they stop being maintained, we may need to copy the few parts we use.
- **One security warning in the build tools.** `npm audit` reports 1 high-severity issue in `brace-expansion`. It only comes in through the release tool, which is used on your machine and not shipped. The warning is 0 for the code that users install.
- **One tooltip per country** was checked from the page's code and the library's source, not by hovering in a real browser.
- **Too many features, too few users.** Features keep being added without outside feedback. Release early, then decide from what people ask for.
- **If the library ever rebuilds its country shapes** (not seen so far), the selected country's outline could be partly covered until the next click.
