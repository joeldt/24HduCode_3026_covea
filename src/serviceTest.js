import { getPlayerDetails } from "./backend/player/playerService.js";
import { moveAndStore } from "./backend/game/moveAndStore.js";
import { getUiState } from "./backend/presenters/uiPresenter.js";

async function runBackendChecks() {
  const player = await getPlayerDetails();
  console.log("PLAYER OK");

  await moveAndStore("N");
  console.log("MOVE OK");

  const uiState = getUiState();
  console.log("UI READY OK", uiState.stats);
}

runBackendChecks().catch((e) => {
  console.error("BACKEND CHECK FAILED:", e.message);
});