import { apiGet } from './api.js';

async function checkBoatUpgrade() {
    try {
        // Récupère les infos du prochain niveau (ex: Niveau 2)
        const data = await apiGet('/ship/next-level');
        
        console.log(`\n🚢 PROCHAIN NIVEAU : ${data.name} (ID: ${data.id})`);
        console.log("-----------------------------------------");
        console.log(`📡 Portée de vue : ${data.visibilityRange} cases`);
        console.log(`⚡ Énergie Max : ${data.maxMovement}`);
        console.log(`⏱️ Vitesse (ms entre déplacements) : ${data.speed}`);
        
        console.log("\n💰 COÛT DE L'AMÉLIORATION :");
        if (data.costResources) {
            Object.entries(data.costResources).forEach(([type, quantity]) => {
                if (quantity > 0) {
                    console.log(`- ${type} : ${quantity}`);
                }
            });
        } else {
            console.log("- Aucun coût en ressources détecté.");
        }

    } catch (err) {
        console.error("❌ Erreur :", err.message);
    }
}

checkBoatUpgrade();