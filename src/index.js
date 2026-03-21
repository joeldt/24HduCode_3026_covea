import { apiGet } from "./api.js";

async function main() {
  try {
    console.log("Récupération des infos joueur...");

    const data = await apiGet("/players/details");

    console.log("Player details:", data);

  } catch (error) {
    console.error("Erreur :", error.message);
  }
}


main();