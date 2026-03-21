import { apiGet } from './api.js';

async function checkPosition() {
    try {
        console.log("🔍 Recherche du navire sur la carte...");
        const data = await apiGet('/players/details');
        
        const ship = data.ship;
        const pos = ship.currentPosition; // Structure selon l'OAS

        console.log("\x1b[33m%s\x1b[0m", "📍 LOCALISATION ACTUELLE :");
        console.log(`- Coordonnées : [X: ${pos.x}, Y: ${pos.y}]`);
        console.log(`- Type de case : ${pos.type} (Zone ${pos.zone})`);
        console.log(`- Énergie restante : ${ship.availableMove} / ${ship.level.maxMovement}`);
        
        if (pos.type === 'SEA') {
            console.log("🌊 Vous êtes en pleine mer.");
        } else if (pos.type === 'SAND') {
            console.log("🏝️ Vous êtes sur une île (ou à quai).");
        }

    } catch (err) {
        console.error("❌ Erreur de radar :", err.message);
    }
}

checkPosition();