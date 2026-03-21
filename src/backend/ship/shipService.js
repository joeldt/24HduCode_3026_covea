import { apiPost } from "../../api.js";

export async function buildShip() {
  return await apiPost("/ship/build");
}

export async function moveShip(direction) {
  return await apiPost("/ship/move", { direction });
}