# IMPLEMENTATION_NOTES

## Scope
- Keep architecture unchanged: `engine/` logic, `render/` canvas/svg layering, `ui/` components.
- Keep core constraints unchanged: D8, 1 cell/tick, color bitmask, Prism/Mirror/Filter/Receiver semantics, anti-loop protection.

## Rule Baseline (unchanged)
- Direction: D8 (`0..7`, 45° step).
- Tick: each beam moves exactly 1 cell per tick.
- Color: `R=1`, `G=2`, `B=4`, `W=7`.
- Prism template: `R=dir-1`, `G=dir`, `B=dir+1`.
- Filter: pass single channel, absorb others.
- Receiver: accumulate per channel by threshold.

## Newly Formalized Time Mechanics
- `sync` + `syncWindow` + optional `syncTargets`.
- `sequence`:
  - `order: ReceiverKey[]`
  - `maxGap: number`
- HUD now visualizes `currentTick / maxTicks`.
- Added lightweight tick controls:
  - Play / Pause
  - Step
  - Speed x1 / x2 / x4

### Why no full replay timeline?
- This pass keeps simulation deterministic and maintainable without introducing heavy frame-time orchestration.
- Tick controls expose timing logic clearly while preserving current architecture/performance.

## New Placeable Tools (discrete + deterministic)
- `MIXER`:
  - Trigger when >=2 beams arrive same cell same tick.
  - Output color = bitwise OR.
  - Output direction = piece dir.
  - Optional constraint `mixerRequireDistinct`.
- `SPLITTER`:
  - Input duplicated to two outputs: `dir` and `dir+2` (90° branch).
- `DELAY`:
  - Queue output with `delayTicks` (1..3).
  - Output direction fixed by piece dir.
  - Queue has bounded capacity (overflow absorbed).
- `GATE`:
  - Periodic pass/absorb.
  - Parameters: `gateOpenTicks`, `gateCloseTicks`.

## Engine Notes
- `simulateLevel` rewritten to tick-batch processing:
  - move phase (all beams)
  - same-tick same-cell interaction resolution
  - delayed release injection
- Canvas path generation preserved using segmented beam paths.
- Loop safety retained via visited-state cap + maxTicks + maxBounces.

## Input and Navigation Fixes
- Single global `window` keydown entry (capture mode).
- Tool hotkeys use stable `event.code` first (`Digit1..9` / `Numpad1..9`).
- Only text-input contexts suppress hotkeys.
- Added level navigation:
  - prev/next buttons
  - grouped overview panel
  - 150ms level fade transition + forced `RESET_LEVEL`

## Level Schema Additions
- Existing unified fields retained:
  - `subtitle`, `objective`, `hint`, `designerNote`, `difficulty`
- `rules` extensions:
  - `syncTargets?: ReceiverKey[]`
  - `sequence?: { order: ReceiverKey[]; maxGap: number }`

## Content Expansion (Round 3)
- Added 9 levels:
  - Tutorial: `T05`, `T06`
  - Basic: `B06`, `B07`
  - Intermediate: `I06`, `I07`
  - Advanced: `A04`, `A05`, `A06`
- Total levels: 26.

## Verification
- `check:reflection`: deterministic mirror reflection tests.
- `check:levels`: all level solvability + metadata + difficulty counts.
- `check:timing`: mixer same-tick, delay ticks, gate phase.
- `check:hotkeys`: tool hotkey and undo/redo parser checks.
