import { apiGet } from './api.js';

export function scanSurroundings(discoveredCells) {
    if (!discoveredCells || discoveredCells.length === 0) return;

    console.log("\x1b[36m%s\x1b[0m", "--- RAPPORT DU RADAR ---");
    
    const islands = discoveredCells.filter(cell => cell.type === 'SAND');
    const otherShips = discoveredCells.filter(cell => cell.ships && cell.ships.length > 0);

    if (islands.length > 0) {
        console.log(`🏝️  ${islands.length} morceau(x) d'île détecté(s) aux coordonnées :`);
        islands.forEach(tile => {
            console.log(`   -> [X: ${tile.x}, Y: ${tile.y}]`);
        });
    } else {
        console.log("🌊 Rien que de l'eau à l'horizon...");
    }

    if (otherShips.length > 0) {
        console.log(`🚢 Attention : Autre(s) navire(s) repéré(s) !`);
    }
    console.log("------------------------");
}