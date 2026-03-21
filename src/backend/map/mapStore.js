const mapData = new Map();

function getKey(x, y) {
  return `${x},${y}`;
}

export function setCell(cell) {
  const key = getKey(cell.x, cell.y);
  mapData.set(key, {
    ...mapData.get(key),
    ...cell
  });
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

export function getAllCells() {
  return Array.from(mapData.values());
}

export function getMapBounds() {
  const cells = getAllCells();

  if (cells.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
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