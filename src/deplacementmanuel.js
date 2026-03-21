import readline from 'readline';
import { apiPost } from './api.js';
import { saveCells } from './db.js'; // 1. AJOUT : On importe la fonction de base de données

// Configuration du clavier
readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

console.log("\x1b[32m%s\x1b[0m", "=== PILOTAGE MANUEL DU BATEAU ACTIVÉ ===");
console.log("Touches : Z (Nord), S (Sud), Q (Ouest), D (Est)");
console.log("Quitter : Ctrl + C\n");

let isMoving = false;

process.stdin.on('keypress', async (str, key) => {
    if (key.ctrl && key.name === 'c') process.exit();

    const directions = { 'z': 'N', 's': 'S', 'q': 'W', 'd': 'E' };
    const move = directions[key.name];

    if (move && !isMoving) {
        isMoving = true;
        console.log(`\nDeplacement vers le ${move}...`);
        
        try {
            // Utilisation de l'endpoint correct
            const response = await apiPost('/ship/move', { direction: move });
            
            // Extraction selon ta nouvelle structure JSON
            const posX = response.position.x;
            const posY = response.position.y;
            const energy = response.energy;
            const cells = response.discoveredCells || [];

            console.log(`Succes ! Nouvelle position : [${posX}, ${posY}]`);
            console.log(`Energie restante : ${energy}`);

            // 2. AJOUT : Sauvegarde des cellules vues dans Supabase
            if (cells.length > 0) {
                await saveCells(cells);

                // --- PARTIE RADAR INTÉGRÉE ---
                console.log("\x1b[36m%s\x1b[0m", "--- RAPPORT DU RADAR ---");
                const islandsDetected = cells.filter(cell => cell.type === 'SAND');
                const otherShips = cells.filter(cell => cell.ships && cell.ships.length > 0);

                if (islandsDetected.length > 0) {
                    console.log(`🏝️  ${islandsDetected.length} morceau(x) d'île détecté(s) aux coordonnées :`);
                    islandsDetected.forEach(tile => {
                        console.log(`   -> [X: ${tile.x}, Y: ${tile.y}]`);
                    });
                } else {
                    console.log("🌊 Rien que de l'eau à l'horizon...");
                }

                if (otherShips.length > 0) {
                    console.log(`🚢 Attention : Autre(s) navire(s) repéré(s) !`);
                }
                console.log("------------------------");
                // -----------------------------
            }

            // Analyse de la visibilité (discoveredCells)
            const islands = cells.filter(cell => cell.type === 'SAND');
            if (islands.length > 0) {
                console.log("\x1b[33m%s\x1b[0m", `ILE DETECTEE ! Proximite : ${islands.length} case(s) de sable visible(s).`);
            }

            // Alerte sécurité Guide 3026 [cite: 538, 540]
            if (energy < 5) {
                console.log("\x1b[31m%s\x1b[0m", "DANGER : Energie critique ! Revenez vers une ile connue.");
            }

        } catch (err) {
            const status = err.response ? err.response.status : 'Inconnu';
            console.error(`Erreur ${status} : Deplacement impossible.`);
        } finally {
            isMoving = false;
        }
    }
});