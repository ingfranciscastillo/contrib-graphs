# Changelog

All notable changes to the `contrib-graphs` package and its [docs site](https://ingfranciscastillo.github.io/contrib-graphs/) are listed here. Site changes don't change the package version. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The site's top bar links to the GitHub repository with its star count. With no stars yet, or if the GitHub API can't be reached, it shows only the logo.
- The 404 page shows an empty graph, "0 contributions on this page", in the chosen theme.

### Changed

- The home has one main action, See variants. Read the docs became a quieter link, and the last gallery card now points to the docs on getting data from GitHub, GitLab or any list of dates instead of repeating the install command.
- The main button takes the color of the chosen theme, like the logo and the focus ring.
- The gallery, the footer, the previous/next links and the API page list the designs in the same order.
- In the gallery, `DotsGraph` and `PulseGraph` show the whole year in their half-width cards, and every graph sits at the top of its card.
- The footer links to the repository once.

### Fixed

- On phones, a variant's playground shows the controls right after the preview, before the code and the props reference.
- The theme chips and the preview width switch work like radio groups: arrow keys, Home and End pick an option, and each group is a single Tab stop.
- Graph tooltips in the gallery draw above the sticky demo toolbar.
- The docs and API pages keep running text at a readable width, and their table of contents, hidden on phones before, is a collapsible list.
- The site's top bar no longer overflows between 421px and 700px wide.

## [0.2.0] - 2026-11-26

### Added

- Four new designs:
  - `MonthsGraph`: one small calendar per month. The months wrap onto new rows, so it fits narrow screens without cropping.
  - `WaveformGraph`: one bar per day, mirrored on a center line, like a sound wave.
  - `StitchGraph`: cross-stitch on cloth, where each active day is an X that gets thicker and darker with activity.
  - `PulseGraph`: weekly totals as a smooth line, with the busiest week marked. It takes `onWeekClick`, like `SkylineGraph`.
- Their shadcn registry items: `months-graph`, `waveform-graph`, `stitch-graph` and `pulse-graph`.

## [0.1.2] - 2026-11-12

### Fixed

- Cropped graphs grow back when there is room again. Inside a centering flex container, `ClassicGraph`, `DotsGraph` and `SkylineGraph` stayed cropped after the window got narrower and then wider, for example after rotating a phone.

## [0.1.1] - 2026-11-12

### Fixed

- `TerminalGraph` hides its character grid from screen readers. They read the graph's summary instead of hundreds of block characters.
- The components type-check with both the React 18 and the React 19 type definitions. Before, refs from `@types/react` 19 failed to compile in copied components.

### Changed

- Internal source comments are in English, so components copied with the shadcn CLI read naturally in any project.

## [0.1.0] - 2026-11-12

First release.

### Added

- Seven contribution graph components: `ClassicGraph`, `DotsGraph`, `IsometricGraph`, `TerminalGraph`, `RadialGraph`, `SkylineGraph` and `CompactGraph`.
- Six built-in themes (`github`, `gitlab`, `frost`, `ember`, `violet` and `mono`), custom themes, and light, dark or automatic color mode.
- Keyboard navigation, tooltips, an `aria-live` announcement of the active day, and `prefers-reduced-motion` support for the entry animation.
- `quantile`, `linear` or custom thresholds to map counts to the five color levels.
- Localized dates and numbers, and configurable labels for the header, units and legend.
- Responsive `crop` and `scale` modes for narrow screens.
- The `contrib-graphs/data` entry, without React: `buildCalendar`, `computeStats`, themes, sample data, and adapters for GitHub (GraphQL) and GitLab, `fromDates` for any list of dates, and `mergeSources` to add them up.
- Server rendering support: components are marked `'use client'` for the Next.js App Router, and `contrib-graphs/data` works in Server Components.
- ESM and CommonJS builds with TypeScript types, and a single `styles.css`.

[Unreleased]: https://github.com/ingfranciscastillo/contrib-graphs/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/ingfranciscastillo/contrib-graphs/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/ingfranciscastillo/contrib-graphs/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/ingfranciscastillo/contrib-graphs/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/ingfranciscastillo/contrib-graphs/releases/tag/v0.1.0
