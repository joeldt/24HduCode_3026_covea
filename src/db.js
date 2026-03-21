import { createClient } from '@supabase/supabase-js';

// 1. Initialisation du client Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Attention : SUPABASE_URL ou SUPABASE_KEY manquant dans le .env");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Fonction pour sauvegarder une ou plusieurs cellules de la carte
export async function saveCells(cellsArray) {
  try {
    // cellsArray doit être un tableau d'objets 
    const { data, error } = await supabase
      .from('map_cells')
      .upsert(cellsArray, { onConflict: 'x,y' }); // upsert met à jour si la case existe déjà !

    if (error) {
      throw error;
    }
    
    console.log(`🗺️  Cartographie mise à jour : ${cellsArray.length} cellules enregistrées.`);
    return data;
  } catch (error) {
    console.error("Erreur lors de la sauvegarde Supabase :", error.message);
  }
}