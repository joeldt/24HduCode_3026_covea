import { apiPost } from "../../api.js";

export async function upgradeMyStorage() {
  console.log("--- TENTATIVE D'AMÉLIORATION DE L'ENTREPÔT ---");

  try {
    const response = await apiPost("/storage/upgrade", {});

    console.log("✅ Succès ! Votre entrepôt a été amélioré.");
    console.log(`Nouveau niveau : ${response.levelId}`);
    console.log("Nouvelle capacité :", response.maxResources);

    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error("❌ Erreur amélioration entrepôt :", error.message);

    return {
      success: false,
      error: error.message
    };
  }
}