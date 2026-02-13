# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Added new timing-centric win condition schema:
  - `syncTargets` for partial sync groups.
  - `sequence` (`order` + `maxGap`) for ordered receiver activation.
- Added four creative tools with full pipeline support (types/engine/ui/icons/inspector/hotkeys):
  - `MIXER`, `SPLITTER`, `DELAY`, `GATE`.
- Added tick gameplay controls in HUD: `currentTick/maxTicks`, `Play/Pause`, `Step`, `x1/x2/x4`.
- Added level navigation upgrades:
  - previous/next level buttons,
  - level index indicator,
  - grouped `Level Overview` panel with completion/best metrics.
- Added round-3 validation scripts:
  - `npm run check:timing` (`scripts/check-timing.ts`) for mixer/delay/gate timing behavior.
  - `npm run check:hotkeys` (`scripts/test-hotkeys.ts`) for tool hotkey parser coverage.
- Added 9 new levels:
  - Tutorial: `T05`, `T06`
  - Basic: `B06`, `B07`
  - Intermediate: `I06`, `I07`
  - Advanced: `A04`, `A05`, `A06`
- Added extended level verification coverage for all 26 levels in `scripts/verify-levels.ts`.
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
- Added keyboard controls (`R`, `Shift+R`, `Delete/Backspace`, `Ctrl/⌘+Z`, `Ctrl/⌘+Y`, `Ctrl/⌘+Shift+Z`, tool hotkeys 1-5).
- Added Canvas ray renderer with glow and SVG overlay piece renderer.
- Added unified custom SVG piece assets under `src/assets/pieces/`:
  - Source, Prism, Mirror,
  - FilterR/G/B,
  - ReceiverR/G/B.
- Added new `Inspector` panel:
  - selected piece details,
  - rotate/delete actions,
  - solution string copy.
- Added optional level metadata fields:
  - `subtitle`, `objective`, `hint`, `designerNote`, `buildPads`.
- Added required level taxonomy field: `difficulty` (`tutorial` / `basic` / `intermediate` / `advanced`).
- Added regression helper script `scripts/verify-levels.ts` and npm command `npm run check:levels` to verify known-solvable level states.
- Added deterministic mirror reflection harness `scripts/test-reflection.ts` and npm command `npm run check:reflection`.
- Added expanded level set under `src/levels/` with four difficulty bands:
  - Tutorial: `T01`-`T04`,
  - Basic: `B01`-`B05`,
  - Intermediate: `I01`-`I05`,
  - Advanced: `A01`-`A03`.
- Added level verification coverage for all 17 levels with fixed known-solvable placements.
- Added user-facing docs:
  - `README.md` (updated UI flow, controls, level format),
  - `START_COMMAND.md` quick start.

### Changed
- Changed simulation core from per-beam queue stepping to tick-batch processing while preserving D8/1-cell-per-tick constraints.
- Changed keyboard input handling to a single global capture-phase entry (`window` keydown) with `event.code`-first digit parsing.
- Changed tool hotkey range from `1..5` to `1..9` to cover new tools.
- Changed TopBar UX to include quick prev/next navigation and overview entry without removing grouped dropdown selection.
- Changed App level switching flow to include 150ms fade transition + forced level reset to prevent state leakage.
- Changed Inspector to support live config editing for new tools (`delayTicks`, `gateOpenTicks`, `gateCloseTicks`, `mixerRequireDistinct`).
- Changed README / IMPLEMENTATION_NOTES / AGENT context docs for tick gameplay formalization and new toolset.
- Replaced first-pass UI with a full visual/interaction redesign:
  - new layout composition (TopBar + Tool Dock + Board + Mission HUD + Inspector),
  - rewritten panel/button/card primitives,
  - redesigned board cell states and placement guidance,
  - upgraded receiver status visuals (ring gauges).
- Refactored app behavior for explicit level switching reset (no state set inside effect).
- Updated levels to communicate objective intent directly in the UI and reduce blind trial-and-error.
- Updated levels to enforce consistent JSON schema across the new level library (`subtitle/objective/hint/designerNote/difficulty`).
- Updated TypeScript config to include React type entries for strict build compatibility.
- Updated visual theme from blue-biased dark UI to neutral gray + off-white palette with tighter token discipline.
- Updated mirror rendering to show only two effective states (`/` and `\`) so visuals match engine behavior.
- Updated top-level level selector UI to show grouped options by difficulty.
- Updated level loading sort order to difficulty-first, then id.

### Fixed
- Fixed unstable numeric tool hotkeys by removing focus-sensitive handler churn and consolidating keyboard handling into one deterministic path.
- Fixed multiple timing puzzle regressions by correcting Delay output-direction assumptions in level solutions (`I06`, `I07`, `A06`) and resolving `A04` source-line collision.
- Fixed Bug A: ray colors rendered black in some environments because Canvas did not reliably resolve CSS custom properties; now colors are resolved to concrete values before drawing.
- Fixed Bug B: mirror reflection appeared incorrect after repeated rotations due visual orientation drifting away from logical orientation; mirror display is now parity-locked to two canonical orientations and reflection path uses explicit mirror-dir helper.
- Fixed key handling to support both Windows and macOS undo/redo patterns.
- Fixed confusing placement behavior by adding invalid-operation feedback and highlighted legal cells.
- Fixed L01 routing bug where blue beam was previously intercepted by green receiver placement.
- Fixed CSS build issues caused by invalid `@apply` usage with alpha variants on custom colors.
- Fixed lint/build issues to keep `npm run lint` and `npm run build` clean.
- Fixed staged level designs with scripted solvability checks to prevent dead/unsat puzzle configs.

### Known Issues
- `npm run dev` is an interactive long-running process; in CI-like scripted checks it may timeout by design. Repro: run dev with short command timeout.

## [0.1.0] - TBD
### Added
- Initial playable MVP release target (to be completed).
