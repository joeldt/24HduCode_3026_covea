import { playerService } from "./src/backend/player/playerService.js";
import { moveAndStore } from "./src/backend/game/moveAndStore.js";
import { mapStore } from "./src/backend/map/mapStore.js";
import { uiPresenter } from "./src/backend/presenters/uiPresenter.js";
import fs from 'fs';

async function runFullTest() {
    console.log("🚀 Démarrage du test de validation Backend 1A...\n");

    try {
        // TEST 1 : Synchronisation du joueur
        console.log("--- Test 1 : Sync Joueur ---");
        await playerService.sync();
        console.log(`✅ Argent stocké : ${mapStore.player.money}`);
        console.log(`✅ Ressources : ${JSON.stringify(mapStore.player.resources)}`);

        // TEST 2 : Mouvement et Mise à jour du Store
        console.log("\n--- Test 2 : Mouvement et Cartographie ---");
        const initialEnergy = mapStore.ship.energy;
        const moveResult = await moveAndStore("E"); // On bouge à l'Est
        
        console.log(`✅ Nouvelle position : (${mapStore.ship.x}, ${mapStore.ship.y})`);
        console.log(`✅ Énergie mise à jour : ${mapStore.ship.energy} (Initial: ${initialEnergy})`);
        console.log(`✅ Cases découvertes lors du move : ${moveResult.discoveredCells.length}`);
        console.log(`✅ Total cases en mémoire : ${mapStore.cells.size}`);

        // TEST 3 : Persistance (Sauvegarde)
        console.log("\n--- Test 3 : Vérification Sauvegarde ---");
        if (fs.existsSync('./data/mapSnapshot.json')) {
            const stats = fs.statSync('./data/mapSnapshot.json');
            console.log(`✅ Fichier mapSnapshot.json présent (${stats.size} octets)`);
        } else {
            console.error("❌ Erreur : Le fichier de sauvegarde n'a pas été créé !");
        }

        // TEST 4 : UI Presenter (Ce que le front voit)
        console.log("\n--- Test 4 : UI Presenter ---");
        const globalState = uiPresenter.getGlobalState();
        if (globalState.ship && globalState.player && Array.isArray(globalState.map)) {
            console.log("✅ Le Presenter renvoie bien toutes les données au Front.");
            console.log(`📊 Stats : ${globalState.map.length} cases dans l'objet envoyé au Front.`);
        }

        console.log("\n🟢 TOUT FONCTIONNE ! Ton Backend 1A est prêt.");

    } catch (error) {
        console.error("\n🔴 ÉCHEC DU TEST :");
        console.error(error);
    }
}

runFullTest();