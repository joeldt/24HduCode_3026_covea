import { saveMapShot } from "../storage/saveMapShot.js";

// Stockage interne de la carte
const mapData = new Map();

// Helper pour générer la clé unique x,y
function getCellKey(x, y) {
  return `${x},${y}`;
}

/**
 * OBJET CENTRAL : mapStore
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

  /**
   * Ajoute ou met à jour une cellule
   * Fusionne les données existantes avec les nouvelles
   * Sauvegarde automatiquement
   */
  setCell(x, y, data) {
    const key = getCellKey(x, y);

    const previous = this.cells.get(key) || {};
    const merged = { ...previous, x, y, ...data };

    this.cells.set(key, merged);

    // Sauvegarde automatique
    saveMapShot(this.cells);
  },

  /**
   * Mise à jour du joueur
   */
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

  /**
   * Mise à jour du bateau
   */
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
 * FONCTIONS EXPORTÉES
 */

// Appelée par mapMerge.js
export function setCell(cell) {
  const { x, y, ...data } = cell;
  mapStore.setCell(x, y, data);
}

export function mergeCells(cells = []) {
  for (const cell of cells) {
    if (
      cell &&
      typeof cell.x === "number" &&
      typeof cell.y === "number" &&
      cell.type
    ) {
      setCell(cell);
    }
  }
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

export function getMapBounds() {
  const cells = getAllCells();

  if (cells.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  const xs = cells.map(c => c.x);
  const ys = cells.map(c => c.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
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
    moveHistory: globalThis.moveHistory || [],
    currentPosition: mapStore.ship,
    currentEnergy: mapStore.ship.energy
  };
}
