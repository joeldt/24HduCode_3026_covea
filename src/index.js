import 'dotenv/config'; 
import { apiGet } from "./api.js";
import { startBroker } from "./broker.js";

async function main() {
  try {
    console.log("Recuperation des infos joueur...");

    // 1. On recupere les details du joueur via l'API
    const data = await apiGet("/players/details");
    console.log("Player details:", data);

    // 2. On lance l'ecoute de la file d'attente 
    console.log("\nLancement de la connexion au broker...");
    await startBroker();

  } catch (error) {
    console.error("Erreur :", error.message);
  }
}

main();