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

    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error("❌ Erreur déplacement :", error.message);

    return {
      success: false,
      error: error.message
    };
  }
}