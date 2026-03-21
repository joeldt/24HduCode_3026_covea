import { getKnownCells, getMapBounds, getSandCells } from "../map/mapSelectors.js";
import { getRuntimeState } from "../game/moveAndStore.js";

export function getUiState() {
  const runtime = getRuntimeState();
  const knownCells = getKnownCells();
  const bounds = getMapBounds();
  const sandCells = getSandCells();

  return {
    boat: {
      x: runtime.currentPosition?.x ?? null,
      y: runtime.currentPosition?.y ?? null,
      type: runtime.currentPosition?.type ?? null,
      energy: runtime.currentEnergy
    },
    stats: {
      knownCellsCount: knownCells.length,
      sandCellsCount: sandCells.length,
      movesCount: runtime.moveHistory.length
    },
    bounds,
    knownCells,
    history: runtime.moveHistory
  };
}