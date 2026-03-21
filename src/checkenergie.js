import { apiGet } from './api.js';

async function checkEnergy() {
    try {
        // On récupère les détails complets du joueur
        const data = await apiGet('/players/details');
        
        const ship = data.ship;
        const current = ship.availableMove;
        const max = ship.level.maxMovement;
        const percentage = Math.round((current / max) * 100);

        console.log("\n--- ÉTAT DE LA BATTERIE ---");
        console.log(`⚡ Énergie : ${current} / ${max} (${percentage}%)`);
        
        if (current === 0) {
            console.log("❌ ALERTE : Vous êtes en panne sèche ! Revenez à la base.");
        } else if (current < 5) {
            console.log("⚠️ ATTENTION : Énergie faible.");
        } else {
            console.log("✅ Vous avez assez d'énergie pour explorer.");
        }
        console.log("---------------------------\n");

    } catch (err) {
        console.error("❌ Impossible de récupérer l'énergie :", err.message);
    }
}

checkEnergy();