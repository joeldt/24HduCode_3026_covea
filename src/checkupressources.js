import { apiGet } from './api.js';

async function checkUpgradeCost() {
    try {
        const data = await apiGet('/storage/next-level');
        console.log(`\n🏠 Analyse du niveau : ${data.name} (Niveau ${data.id})`);
        
        // La structure correcte selon l'OAS est un tableau 'costs'
        if (data.costs && data.costs.length > 0) {
            console.log("💰 COÛTS RÉELS DÉTECTÉS :");
            data.costs.forEach(item => {
                console.log(`- ${item.type} : ${item.quantity}`);
            });
        } else {
            console.log("⚠️ Aucun coût détecté dans 'costs'. Vérification des champs alternatifs...");
            if (data.upgradeCostGold) console.log(`- OR : ${data.upgradeCostGold}`);
        }
    } catch (err) {
        console.error("❌ Erreur :", err.message);
    }
}
checkUpgradeCost();