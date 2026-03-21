import { moveManually } from "../deplacement/deplacementmanuel.js";
import { mergeCells, setCell, getAllCells, getMapBounds } from "../map/mapStore.js";

const runtimeState = {
  position: null,
  energy: null,
  history: []
};

export async function moveAndStore(direction) {
  const result = await moveManually(direction);

  if (!result.success) {
    return result;
  }

  const response = result.data;

  if (Array.isArray(response.discoveredCells)) {
    mergeCells(response.discoveredCells);
  }

  if (response.position) {
    setCell(response.position);
    runtimeState.position = response.position;
  }

  if (typeof response.energy === "number") {
    runtimeState.energy = response.energy;
  }

  runtimeState.history.push({
    direction,
    position: response.position || null,
    energy: response.energy ?? null,
    discoveredCount: response.discoveredCells?.length || 0,
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    data: {
      position: runtimeState.position,
      energy: runtimeState.energy,
      knownCells: getAllCells(),
      bounds: getMapBounds(),
      history: runtimeState.history
    }
  };
}

export function getRuntimeState() {
  return {
    position: runtimeState.position,
    energy: runtimeState.energy,
    history: runtimeState.history,
    knownCells: getAllCells(),
    bounds: getMapBounds()
  };
}