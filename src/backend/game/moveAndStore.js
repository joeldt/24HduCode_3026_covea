import { moveShip } from "../ship/shipService.js";
import { mergeDiscoveredCells } from "../map/mapMerge.js";
import { mapStore } from "../map/mapStore.js"; 

// On garde l'historique ici pour le suivi du run actuel
const moveHistory = [];

export async function moveAndStore(direction) {
  // 1. Appel au service de mouvement (API)
  const response = await moveShip(direction);

  // 2. Mise à jour de la carte dans le Store Global
  if (Array.isArray(response.discoveredCells)) {
    mergeDiscoveredCells(response.discoveredCells);
  }

  // 3. Mise à jour du bateau (Position + Énergie) dans le Store Global
  if (response.position) {
    mapStore.updateShip(response.position, response.energy);
  }

  // 4. Archivage dans l'historique local
  const historyEntry = {
    direction,
    position: response.position || null,
    energy: response.energy ?? null,
    discoveredCount: response.discoveredCells?.length || 0,
    timestamp: new Date().toISOString()
  };
  moveHistory.push(historyEntry);

  // 5. Retourne un objet complet pour le Front
  return {
    success: true,
    position: mapStore.ship,
    energy: mapStore.ship.energy,
    discoveredCells: response.discoveredCells || [],
    moveHistory: moveHistory
  };
}

// Fonctions utilitaires pour le Presenter
export function getMoveHistory() {
  return moveHistory;
}

export function getRuntimeState() {
  return {
    moveHistory: moveHistory || [],
    currentPosition: mapStore.ship,
    currentEnergy: mapStore.ship.energy
  };
}