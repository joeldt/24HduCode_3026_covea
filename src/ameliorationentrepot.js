import { apiPut } from './api.js';

async function upgradeStorage() {
    try {
        const data = await apiPut('/storage/upgrade', {});
        console.log("✅ Entrepôt amélioré ! Nouvelle capacité :", data.maxResources);
    } catch (err) {
        console.error("❌ Échec :", err.message);
    }
}
upgradeStorage();