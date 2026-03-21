import { apiGet } from "../../api.js";

export async function getPlayerDetails() {
  return await apiGet("/players/details");
}

export async function getResources() {
  return await apiGet("/resources");
}