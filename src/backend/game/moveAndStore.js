import { moveShip } from "../ship/shipService.js";
import { mergeDiscoveredCells } from "../map/mapMerge.js";
import { setCell } from "../map/mapStore.js";

const gameRuntimeState = {
  currentPosition: null,
  currentEnergy: null,
  moveHistory: []
};

export async function moveAndStore(direction) {
  const response = await moveShip(direction);

  if (Array.isArray(response.discoveredCells)) {
    mergeDiscoveredCells(response.discoveredCells);
  }

  if (response.position) {
    setCell(response.position);
    gameRuntimeState.currentPosition = response.position;
  }

  if (typeof response.energy === "number") {
    gameRuntimeState.currentEnergy = response.energy;
  }

  gameRuntimeState.moveHistory.push({
    direction,
    position: response.position || null,
    energy: response.energy ?? null,
    discoveredCount: response.discoveredCells?.length || 0,
    timestamp: new Date().toISOString()
  });

  return {
    position: gameRuntimeState.currentPosition,
    energy: gameRuntimeState.currentEnergy,
    discoveredCells: response.discoveredCells || [],
    moveHistory: gameRuntimeState.moveHistory
  };
}

export function getRuntimeState() {
  return gameRuntimeState;
}