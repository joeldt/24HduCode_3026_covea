import { getAllCells, getCell } from "./mapStore.js";

export function getKnownCells() {
  return getAllCells();
}

export function getCellsByType(type) {
  return getAllCells().filter((cell) => cell.type === type);
}

export function getSeaCells() {
  return getCellsByType("SEA");
}

export function getSandCells() {
  return getCellsByType("SAND");
}

export function getRocksCells() {
  return getCellsByType("ROCKS");
}

export function getCellAt(x, y) {
  return getCell(x, y);
}

export function getMapBounds() {
  const cells = getAllCells();

  if (cells.length === 0) {
    return {
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0
    };
  }

  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
}