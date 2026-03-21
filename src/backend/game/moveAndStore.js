<<<<<<< HEAD
import { moveManually } from "../deplacement/deplacementmanuel.js";
import { mergeCells, setCell, getAllCells, getMapBounds } from "../map/mapStore.js";

const runtimeState = {
  position: null,
  energy: null,
  history: []
};
=======
import { moveShip } from "../ship/shipService.js";
import { mergeDiscoveredCells } from "../map/mapMerge.js";
import { mapStore } from "../map/mapStore.js"; // On utilise ton store global

// On garde l'historique ici car c'est spécifique au "run" actuel
const moveHistory = [];
>>>>>>> 5a6c368e4fcb12caee064e2bed68f67fb3b21b59

export async function moveAndStore(direction) {
  const result = await moveManually(direction);

  if (!result.success) {
    return result;
  }

  const response = result.data;

  // Mise à jour de la carte (via merge ou setCell)
  if (Array.isArray(response.discoveredCells)) {
<<<<<<< HEAD
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
=======
    mergeDiscoveredCells(response.discoveredCells);
    // NotemergeDiscoveredCells devrait appeler mapStore.setCell en interne
  }

  // Mise à jour du SHIP dans le Store Global
  if (response.position && typeof response.energy === "number") {
    mapStore.updateShip(response.position, response.energy);
  }

  // Archivage dans l'historique local
  const historyEntry = {
>>>>>>> 5a6c368e4fcb12caee064e2bed68f67fb3b21b59
    direction,
    position: response.position || null,
    energy: response.energy ?? null,
    discoveredCount: response.discoveredCells?.length || 0,
    timestamp: new Date().toISOString()
  };
  moveHistory.push(historyEntry);

  // On retourne un objet clair pour le reste de l'app
  return {
<<<<<<< HEAD
    success: true,
    data: {
      position: runtimeState.position,
      energy: runtimeState.energy,
      knownCells: getAllCells(),
      bounds: getMapBounds(),
      history: runtimeState.history
    }
=======
    position: mapStore.ship,
    energy: mapStore.ship.energy,
    discoveredCells: response.discoveredCells || [],
    moveHistory: moveHistory
>>>>>>> 5a6c368e4fcb12caee064e2bed68f67fb3b21b59
  };
}

export function getMoveHistory() {
  return moveHistory;
}
export function getRuntimeState() {
  return {
<<<<<<< HEAD
    position: runtimeState.position,
    energy: runtimeState.energy,
    history: runtimeState.history,
    knownCells: getAllCells(),
    bounds: getMapBounds()
=======
    moveHistory: moveHistory || [],
    // On peut ajouter d'autres infos si nécessaire
>>>>>>> 5a6c368e4fcb12caee064e2bed68f67fb3b21b59
  };
}