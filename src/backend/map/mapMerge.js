import { setCell } from "./mapStore.js";

export function mergeDiscoveredCells(cells = []) {
  if (!Array.isArray(cells)) return;

  for (const cell of cells) {
    if (
      typeof cell?.x === "number" &&
      typeof cell?.y === "number" &&
      cell?.type
    ) {
      setCell(cell);
    }
  }
}