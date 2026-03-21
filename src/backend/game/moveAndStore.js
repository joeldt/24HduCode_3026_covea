import { moveShip } from "../ship/shipService.js";
import { mergeDiscoveredCells } from "../map/mapMerge.js";
import { mapStore } from "../map/mapStore.js"; // On utilise ton store global

// On garde l'historique ici car c'est spécifique au "run" actuel
const moveHistory = [];

export async function moveAndStore(direction) {
  const response = await moveShip(direction);

  // Mise à jour de la carte (via merge ou setCell)
  if (Array.isArray(response.discoveredCells)) {
    mergeDiscoveredCells(response.discoveredCells);
    // NotemergeDiscoveredCells devrait appeler mapStore.setCell en interne
  }

  // Mise à jour du SHIP dans le Store Global
  if (response.position && typeof response.energy === "number") {
    mapStore.updateShip(response.position, response.energy);
  }

  // Archivage dans l'historique local
  const historyEntry = {
    direction,
    position: response.position || null,
    energy: response.energy ?? null,
    discoveredCount: response.discoveredCells?.length || 0,
    timestamp: new Date().toISOString()
  };
  moveHistory.push(historyEntry);

  // On retourne un objet clair pour le reste de l'app
  return {
    position: mapStore.ship,
    energy: mapStore.ship.energy,
    discoveredCells: response.discoveredCells || [],
    moveHistory: moveHistory
  };
}

export function getMoveHistory() {
  return moveHistory;
}
export function getRuntimeState() {
  return {
    moveHistory: moveHistory || [],
    // On peut ajouter d'autres infos si nécessaire
  };
}