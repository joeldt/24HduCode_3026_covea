import { apiPost } from "../../api.js";
import { saveCells } from "../../db.js";

export async function moveManually(direction) {
  const allowedDirections = ["N", "S", "E", "W", "NE", "NW", "SE", "SW"];

  if (!allowedDirections.includes(direction)) {
    return {
      success: false,
      error: `Direction invalide : ${direction}`
    };
  }

  try {
    const response = await apiPost("/ship/move", { direction });

    const posX = response?.position?.x ?? null;
    const posY = response?.position?.y ?? null;
    const energy = response?.energy ?? null;
    const cells = response?.discoveredCells || [];

    if (cells.length > 0) {
      await saveCells(cells);
    }

    const islandsDetected = cells.filter((cell) => cell.type === "SAND");
    const otherShips = cells.filter((cell) => cell.ships && cell.ships.length > 0);

    const radarReport = {
      islandsDetectedCount: islandsDetected.length,
      islandsDetectedTiles: islandsDetected.map((tile) => ({
        x: tile.x,
        y: tile.y
      })),
      otherShipsDetected: otherShips.length > 0,
      otherShipsCount: otherShips.length
    };

    return {
      success: true,
      data: {
        raw: response,
        position: { x: posX, y: posY },
        energy,
        discoveredCells: cells,
        radarReport
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}