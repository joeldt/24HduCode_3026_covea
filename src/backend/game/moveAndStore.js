import { moveManually } from "../deplacement/deplacementmanuel.js";
import { mergeCells, setCell, getAllCells, getMapBounds } from "../map/mapStore.js";

const runtimeState = {
  position: null,
  energy: null,
  history: [],
  radarHistory: [],
  islandDetectionHistory: []
};

export async function moveAndStore(direction) {
  const result = await moveManually(direction);

  if (!result.success) {
    return result;
  }

  const payload = result.data || {};
  const raw = payload.raw || {};
  const discoveredCells = payload.discoveredCells || [];
  const position = raw.position || null;
  const energy =
    typeof raw.energy === "number"
      ? raw.energy
      : payload.energy ?? null;
  const radarReport = payload.radarReport || null;

  if (discoveredCells.length > 0) {
    mergeCells(discoveredCells);
  }

  if (position) {
    setCell(position);
    runtimeState.position = position;
  }

  if (energy !== null) {
    runtimeState.energy = energy;
  }

  const moveEntry = {
    direction,
    position: runtimeState.position,
    energy: runtimeState.energy,
    discoveredCount: discoveredCells.length,
    timestamp: new Date().toISOString(),
    radarReport
  };

  runtimeState.history.push(moveEntry);

  if (radarReport) {
    runtimeState.radarHistory.push({
      timestamp: moveEntry.timestamp,
      ...radarReport
    });

    if (radarReport.islandsDetectedCount > 0) {
      runtimeState.islandDetectionHistory.push({
        timestamp: moveEntry.timestamp,
        position: runtimeState.position,
        tiles: radarReport.islandsDetectedTiles
      });
    }
  }

  return {
    success: true,
    data: {
      position: runtimeState.position,
      energy: runtimeState.energy,
      knownCells: getAllCells(),
      bounds: getMapBounds(),
      history: runtimeState.history,
      radarHistory: runtimeState.radarHistory,
      islandDetectionHistory: runtimeState.islandDetectionHistory,
      lastRadarReport: radarReport
    }
  };
}

export function getRuntimeState() {
  return {
    position: runtimeState.position,
    energy: runtimeState.energy,
    history: runtimeState.history,
    knownCells: getAllCells(),
    bounds: getMapBounds(),
    radarHistory: runtimeState.radarHistory,
    islandDetectionHistory: runtimeState.islandDetectionHistory,
    lastRadarReport:
      runtimeState.radarHistory.length > 0
        ? runtimeState.radarHistory[runtimeState.radarHistory.length - 1]
        : null
  };
}