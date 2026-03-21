const mapData = new Map();

function getCellKey(x, y) {
  return `${x},${y}`;
}

export function setCell(cell) {
  const key = getCellKey(cell.x, cell.y);
  mapData.set(key, {
    ...mapData.get(key),
    ...cell
  });
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

export function getMapAsObject() {
  return Object.fromEntries(mapData.entries());
}

export function loadMapFromObject(obj = {}) {
  mapData.clear();

  for (const [key, value] of Object.entries(obj)) {
    mapData.set(key, value);
  }
}

export function clearMap() {
  mapData.clear();
}