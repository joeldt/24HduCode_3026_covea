import { apiGet } from "../../api.js";

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