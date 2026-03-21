import readline from 'readline';
import { apiPost } from './api.js';

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
        console.log(`\nDéplacement vers le ${move}...`);
        
        try {
            // Utilisation de l'endpoint correct
            const response = await apiPost('/ship/move', { direction: move });
            
            // Extraction selon ta nouvelle structure JSON
            const posX = response.position.x;
            const posY = response.position.y;
            const energy = response.energy;
            const cells = response.discoveredCells || [];

            console.log(`✅ Succès ! Nouvelle position : [${posX}, ${posY}]`);
            console.log(`⚡ Énergie restante : ${energy}`);

            // Analyse de la visibilité (discoveredCells)
            const islands = cells.filter(cell => cell.type === 'SAND');
            if (islands.length > 0) {
                console.log("\x1b[33m%s\x1b[0m", `🏝️  ÎLE DÉTECTÉE ! Proximité : ${islands.length} case(s) de sable visible(s).`);
            }

            // Alerte sécurité Guide 3026
            if (energy < 5) {
                console.log("\x1b[31m%s\x1b[0m", "⚠️ DANGER : Énergie critique ! Revenez vers une île connue.");
            }

        } catch (err) {
            const status = err.response ? err.response.status : 'Inconnu';
            console.error(`❌ Erreur ${status} : Déplacement impossible.`);
        } finally {
            isMoving = false;
        }
    }
});