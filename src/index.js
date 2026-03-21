import { moveAndStore } from "./backend/game/moveAndStore.js";
import { saveMapShot } from "./backend/storage/saveMapShot.js";

async function main() {
  try {
    await moveAndStore("N");
    const path = saveMapShot();
    console.log("SAVE OK:", path);
  } catch (error) {
    console.error("TEST SAVE KO:", error.message);
  }
}

main();