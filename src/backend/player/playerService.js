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
  return await apiGet("/players/details");
}

export async function getResources() {
  return await apiGet("/resources");
}