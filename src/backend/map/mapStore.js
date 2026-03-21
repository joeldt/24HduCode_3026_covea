import { saveMapShot } from "../storage/saveMapShot.js";

// Stockage interne de la carte
const mapData = new Map();

// Helper pour générer la clé unique x,y
function getCellKey(x, y) {
  return `${x},${y}`;
}

/**
 * L'OBJET CENTRAL (BACKEND 1A)
 * Regroupe la carte, le joueur et le bateau
 */
export const mapStore = {
  cells: mapData,
  player: {
    money: 0,
    resources: {},
    home: null
  },
  ship: {
    x: 0,
    y: 0,
    energy: 0
  },

  // Méthode interne pour ajouter une cellule et sauvegarder
  setCell(x, y, data) {
    const key = getCellKey(x, y);
    this.cells.set(key, data);
    // Sauvegarde automatique sur le disque
    saveMapShot(this.cells); 
  },

  // Mise à jour des infos joueur (argent, ressources)
  updatePlayer(details) {
    if (!details) return;
    this.player.money = details.money;
    this.player.home = details.home;
    if (details.resources) {
      details.resources.forEach(r => {
        this.player.resources[r.type] = r.quantity;
      });
    }
  },

  // Mise à jour de la position et de l'énergie du bateau
  updateShip(position, energy) {
    if (position) {
      this.ship.x = position.x;
      this.ship.y = position.y;
    }
    if (energy !== undefined) {
      this.ship.energy = energy;
    }
  }
};

/**
 * FONCTIONS EXPORTÉES (Pour la compatibilité avec le reste du code)
 */

// Cette fonction est celle appelée par mapMerge.js
export function setCell(cell) {
  const { x, y, ...data } = cell;
  mapStore.setCell(x, y, data);
}

export function getCell(x, y) {
  return mapData.get(getCellKey(x, y)) || null;
}

export function hasCell(x, y) {
  return mapData.has(getCellKey(x, y));
}

export function getAllCells() {
  return Array.from(mapData.values());
}

export function loadMapFromObject(obj = {}) {
  mapData.clear();
  for (const [key, value] of Object.entries(obj)) {
    mapData.set(key, value);
  }
}
export function getMapAsObject() {
  return Object.fromEntries(mapData.entries());
}

export function getRuntimeState() {
  return {
    moveHistory: moveHistory || [],
    // On peut ajouter la position si saveMapShot en a besoin
    currentPosition: mapStore.ship,
    currentEnergy: mapStore.ship.energy
  };
}