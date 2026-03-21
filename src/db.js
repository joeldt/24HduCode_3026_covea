import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveCells(cellsArray) {
  try {
    // 1. On formate les donnees pour correspondre exactement a ta table SQL
    const formattedCells = cellsArray.map(cell => ({
        x: cell.x,
        y: cell.y,
        type: cell.type,
        island_id: cell.islandId || null
    }));

    // 2. On envoie a Supabase en precisant que x et y sont les cles primaires
    const { data, error } = await supabase
      .from('map_cells')
      .upsert(formattedCells, { onConflict: 'x,y' });

    if (error) {
      throw error;
    }
    
    console.log(`[Base de donnees] Cartographie mise a jour : ${formattedCells.length} cellules enregistrees.`);
    return data;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde Supabase :", error.message);
  }
}