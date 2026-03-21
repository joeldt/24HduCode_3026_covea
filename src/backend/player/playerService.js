import { apiGet } from "../../api.js";
import { mapStore } from "../map/mapStore.js";

export const playerService = {
  async sync() {
    try {
      const details = await apiGet("/players/details");
      mapStore.updatePlayer(details);
      console.log(" State synchronisé");
    } catch (err) {
      console.error(" Erreur sync:", err.message);
    }
  }
};

export async function getPlayerDetails() {
  try {
    const data = await apiGet("/players/details");

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}