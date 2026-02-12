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
- Added regression helper script `scripts/verify-levels.ts` and npm command `npm run check:levels` to verify known-solvable level states.
- Added deterministic mirror reflection harness `scripts/test-reflection.ts` and npm command `npm run check:reflection`.
- Added rebuilt level set under `src/levels/` with guided puzzle intent:
  - `L01` single-mirror green routing,
  - `L02` filter purification with purity rule,
  - `L03` two-bounce mirror routing.
- Added user-facing docs:
  - `README.md` (updated UI flow, controls, level format),
  - `START_COMMAND.md` quick start.

### Changed
- Replaced first-pass UI with a full visual/interaction redesign:
  - new layout composition (TopBar + Tool Dock + Board + Mission HUD + Inspector),
  - rewritten panel/button/card primitives,
  - redesigned board cell states and placement guidance,
  - upgraded receiver status visuals (ring gauges).
- Refactored app behavior for explicit level switching reset (no state set inside effect).
- Updated levels to communicate objective intent directly in the UI and reduce blind trial-and-error.
- Updated TypeScript config to include React type entries for strict build compatibility.
- Updated visual theme from blue-biased dark UI to neutral gray + off-white palette with tighter token discipline.
- Updated mirror rendering to show only two effective states (`/` and `\`) so visuals match engine behavior.

### Fixed
- Fixed Bug A: ray colors rendered black in some environments because Canvas did not reliably resolve CSS custom properties; now colors are resolved to concrete values before drawing.
- Fixed Bug B: mirror reflection appeared incorrect after repeated rotations due visual orientation drifting away from logical orientation; mirror display is now parity-locked to two canonical orientations and reflection path uses explicit mirror-dir helper.
- Fixed key handling to support both Windows and macOS undo/redo patterns.
- Fixed confusing placement behavior by adding invalid-operation feedback and highlighted legal cells.
- Fixed L01 routing bug where blue beam was previously intercepted by green receiver placement.
- Fixed CSS build issues caused by invalid `@apply` usage with alpha variants on custom colors.
- Fixed lint/build issues to keep `npm run lint` and `npm run build` clean.

### Known Issues
- `npm run dev` is an interactive long-running process; in CI-like scripted checks it may timeout by design. Repro: run dev with short command timeout.

## [0.1.0] - TBD
### Added
- Initial playable MVP release target (to be completed).
