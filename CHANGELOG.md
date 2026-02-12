# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Added initial product constraints extraction in `IMPLEMENTATION_NOTES.md`.
- Added persistent agent context anchor in `AGENT.md` with MVP boundaries, core rules, design tokens, and decision log.
- Added Keep a Changelog structure in `CHANGELOG.md` for milestone tracking.
- Added Vite + React + TypeScript + Tailwind project scaffold and token-based visual system.
- Added strict engine types: `PieceType`, `Dir8`, `ColorMask`, `LevelDefinition`, `Placement`, `BeamState`, `SimResult`.
- Added D8 simulation engine with:
  - 1 cell/tick propagation,
  - prism RGB split template,
  - mirror reflection,
  - filter pass-through,
  - receiver accumulation and threshold checks,
  - purity/sync-compatible win checks,
  - loop protections (`maxTicks`, visited state count, `maxBounces`).
- Added editor workflow with placement/rotation/deletion and full `Undo/Redo` support.
- Added keyboard controls (`R`, `Shift+R`, `Delete/Backspace`, `Ctrl+Z`, `Ctrl+Y`, tool hotkeys 1-5).
- Added Canvas ray renderer with light glow and SVG overlay piece renderer.
- Added unified custom SVG piece assets under `src/assets/pieces/`:
  - Source, Prism, Mirror,
  - FilterR/G/B,
  - ReceiverR/G/B.
- Added three JSON levels under `src/levels/`:
  - `L01` tutorial (fixed prism + mirror context),
  - `L02` filter introduction,
  - `L03` multi-reflection route.
- Added user-facing docs:
  - `README.md` (setup, keys, structure, level extension),
  - `START_COMMAND.md` quick start.

### Changed
- Replaced default Vite counter UI with complete puzzle game layout:
  - top bar,
  - toolbar,
  - board,
  - right HUD.
- Refactored app into `app / engine / render / ui / assets / levels` structure.
- Updated TypeScript config to include React type entries for strict build compatibility.

### Fixed
- Fixed lint/build issues (`prefer-const`, JSX typing) to pass `npm run lint` and `npm run build`.

## [0.1.0] - TBD
### Added
- Initial playable MVP release target (to be completed).
