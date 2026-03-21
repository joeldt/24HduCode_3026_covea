import { apiPut } from "../../api.js";

export async function upgradeMyStorage() {
  try {
    const response = await apiPut("/storage/upgrade", {});

    return {
      success: true,
      data: response
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}