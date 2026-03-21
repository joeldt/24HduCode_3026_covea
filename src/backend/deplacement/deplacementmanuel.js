import { apiPost } from "../../api.js";

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

    const cells = response?.discoveredCells || [];
    const islandsDetected = cells.filter((cell) => cell.type === "SAND");

    return {
      success: true,
      data: {
        raw: response,
        discoveredCells: cells,
        radarReport: {
          islandsDetectedCount: islandsDetected.length,
          islandsDetectedTiles: islandsDetected.map((tile) => ({
            x: tile.x,
            y: tile.y
          }))
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}