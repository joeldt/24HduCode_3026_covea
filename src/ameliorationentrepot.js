import { apiPost } from './api.js';

async function upgradeMyStorage() {
    console.log("--- TENTATIVE D'AMÉLIORATION DE L'ENTREPÔT ---");
    try {
        // L'endpoint standard pour l'amélioration est généralement /storage/upgrade
        const response = await apiPost('/storage/upgrade', {});
        
        console.log("✅ Succès ! Votre entrepôt a été amélioré.");
        console.log(`Nouveau niveau : ${response.levelId}`);
        console.log(`Nouvelle capacité :`, response.maxResources);
    } catch (err) {
        const status = err.response ? err.response.status : 'Inconnu';
        const message = err.response ? JSON.stringify(err.response.data) : err.message;
        
        console.error(`❌ Erreur ${status} : ${message}`);
        
        if (status === 400) {
            console.log("Conseil : Vérifiez si vous avez assez d'OR pour cette amélioration.");
        }
    }
}

upgradeMyStorage();