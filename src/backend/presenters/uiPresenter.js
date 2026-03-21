import { getKnownCells, getMapBounds, getSandCells } from "../map/mapSelectors.js";
import { getRuntimeState } from "../game/moveAndStore.js";
import { mapStore } from "../map/mapStore.js";

export const uiPresenter = {
  //  donne l'état global (utile pour l'initialisation du Front)
  getGlobalState() {
    return {
      ship: mapStore.ship,
      player: mapStore.player,
      // On transforme la Map en tableau d'objets pour le Front
      map: Array.from(mapStore.cells.entries()).map(([key, value]) => ({
        x: parseInt(key.split(',')[0]),
        y: parseInt(key.split(',')[1]),
        ...value
      }))
    };
  }
};


 //Retourne l'état de l'interface avec les stats calculées

export function getUiState() {
  const runtime = getRuntimeState(); // Pour l'historique
  const knownCells = getKnownCells();
  const bounds = getMapBounds();
  const sandCells = getSandCells();

  return {
    boat: {
      // On utilise la source de vérité du mapStore pour la position actuelle
      x: mapStore.ship.x, 
      y: mapStore.ship.y,
      energy: mapStore.ship.energy,
      // On peut garder le type venant du runtime si besoin
      type: runtime.currentPosition?.type ?? null
    },
    stats: {
      knownCellsCount: knownCells.length,
      sandCellsCount: sandCells.length,
      movesCount: runtime.moveHistory?.length || 0,
      money: mapStore.player.money
    },
    bounds,
    knownCells,
    history: runtime.moveHistory || []
  };
}