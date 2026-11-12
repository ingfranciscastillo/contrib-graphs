# Changelog

All notable changes to the `contrib-graphs` package are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/ingfranciscastillo/contrib-graphs/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/ingfranciscastillo/contrib-graphs/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/ingfranciscastillo/contrib-graphs/releases/tag/v0.1.0
