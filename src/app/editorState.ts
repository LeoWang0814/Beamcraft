import { wrapDir } from '../engine/directions';
import type { GridPoint, Placement, PlaceablePieceType } from '../engine/types';

export interface EditorState {
  placements: Placement[];
  selectedTool: PlaceablePieceType | null;
  selectedCell: GridPoint | null;
  past: Placement[][];
  future: Placement[][];
  nextId: number;
}

export type EditorAction =
  | { type: 'SET_TOOL'; tool: PlaceablePieceType | null }
  | { type: 'SELECT_CELL'; cell: GridPoint | null }
  | { type: 'PLACE'; x: number; y: number; pieceType: PlaceablePieceType }
  | { type: 'ROTATE_SELECTED'; steps: number }
  | {
      type: 'UPDATE_SELECTED_CONFIG';
      config: Partial<Pick<Placement, 'delayTicks' | 'gateOpenTicks' | 'gateCloseTicks' | 'mixerRequireDistinct'>>;
    }
  | { type: 'DELETE_SELECTED' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET_LEVEL' };

export function createInitialEditorState(): EditorState {
  return {
    placements: [],
    selectedTool: null,
    selectedCell: null,
    past: [],
    future: [],
    nextId: 1,
  };
}

function commitPlacements(
  state: EditorState,
  placements: Placement[],
  selectedCell: GridPoint | null = state.selectedCell,
  nextId: number = state.nextId,
): EditorState {
  return {
    ...state,
    placements,
    selectedCell,
    past: [...state.past, state.placements],
    future: [],
    nextId,
  };
}

function sameCell(a: GridPoint | null, b: GridPoint): boolean {
  return Boolean(a && a.x === b.x && a.y === b.y);
}

function defaultConfigForType(type: PlaceablePieceType): Partial<Placement> {
  if (type === 'DELAY') {
    return { delayTicks: 1 };
  }

  if (type === 'GATE') {
    return { gateOpenTicks: 1, gateCloseTicks: 1 };
  }

  if (type === 'MIXER') {
    return { mixerRequireDistinct: false };
  }

  return {};
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_TOOL':
      return {
        ...state,
        selectedTool: action.tool,
      };
    case 'SELECT_CELL':
      return {
        ...state,
        selectedCell: action.cell,
      };
    case 'PLACE': {
      const existingIndex = state.placements.findIndex(
        (placement) => placement.x === action.x && placement.y === action.y,
      );

      if (existingIndex >= 0) {
        const existing = state.placements[existingIndex];
        if (existing.type === action.pieceType) {
          return {
            ...state,
            selectedCell: { x: action.x, y: action.y },
          };
        }

        const replaced: Placement = {
          id: existing.id,
          x: existing.x,
          y: existing.y,
          dir: existing.dir,
          type: action.pieceType,
          ...defaultConfigForType(action.pieceType),
        };

        const placements = [...state.placements];
        placements[existingIndex] = replaced;
        return commitPlacements(state, placements, { x: action.x, y: action.y });
      }

      const placement: Placement = {
        id: `p-${state.nextId}`,
        x: action.x,
        y: action.y,
        dir: 0,
        type: action.pieceType,
        ...defaultConfigForType(action.pieceType),
      };

      return commitPlacements(
        state,
        [...state.placements, placement],
        { x: action.x, y: action.y },
        state.nextId + 1,
      );
    }

    case 'ROTATE_SELECTED': {
      if (!state.selectedCell) {
        return state;
      }

      const placements = state.placements.map((placement) => {
        if (!sameCell(state.selectedCell, placement)) {
          return placement;
        }

        return {
          ...placement,
          dir: wrapDir(placement.dir + action.steps),
        };
      });

      if (placements === state.placements) {
        return state;
      }

      const changed = placements.some((placement, index) => placement.dir !== state.placements[index]?.dir);
      if (!changed) {
        return state;
      }

      return commitPlacements(state, placements);
    }

    case 'UPDATE_SELECTED_CONFIG': {
      if (!state.selectedCell) {
        return state;
      }

      let changed = false;
      const placements = state.placements.map((placement) => {
        if (!sameCell(state.selectedCell, placement)) {
          return placement;
        }

        const nextPlacement: Placement = {
          ...placement,
          ...action.config,
        };

        changed =
          changed ||
          nextPlacement.delayTicks !== placement.delayTicks ||
          nextPlacement.gateOpenTicks !== placement.gateOpenTicks ||
          nextPlacement.gateCloseTicks !== placement.gateCloseTicks ||
          nextPlacement.mixerRequireDistinct !== placement.mixerRequireDistinct;

        return nextPlacement;
      });

      if (!changed) {
        return state;
      }

      return commitPlacements(state, placements);
    }

    case 'DELETE_SELECTED': {
      if (!state.selectedCell) {
        return state;
      }

      const placements = state.placements.filter((placement) => !sameCell(state.selectedCell, placement));
      if (placements.length === state.placements.length) {
        return state;
      }

      return commitPlacements(state, placements, null);
    }

    case 'UNDO': {
      if (state.past.length === 0) {
        return state;
      }

      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        placements: previous,
        past: state.past.slice(0, -1),
        future: [state.placements, ...state.future],
        selectedCell: null,
      };
    }

    case 'REDO': {
      if (state.future.length === 0) {
        return state;
      }

      const [next, ...restFuture] = state.future;
      return {
        ...state,
        placements: next,
        future: restFuture,
        past: [...state.past, state.placements],
        selectedCell: null,
      };
    }

    case 'RESET_LEVEL':
      return createInitialEditorState();

    default:
      return state;
  }
}

export function countPlacementsByType(placements: Placement[]): Record<PlaceablePieceType, number> {
  return {
    MIRROR: placements.filter((placement) => placement.type === 'MIRROR').length,
    PRISM: placements.filter((placement) => placement.type === 'PRISM').length,
    FILTER_R: placements.filter((placement) => placement.type === 'FILTER_R').length,
    FILTER_G: placements.filter((placement) => placement.type === 'FILTER_G').length,
    FILTER_B: placements.filter((placement) => placement.type === 'FILTER_B').length,
    MIXER: placements.filter((placement) => placement.type === 'MIXER').length,
    SPLITTER: placements.filter((placement) => placement.type === 'SPLITTER').length,
    DELAY: placements.filter((placement) => placement.type === 'DELAY').length,
    GATE: placements.filter((placement) => placement.type === 'GATE').length,
  };
}
