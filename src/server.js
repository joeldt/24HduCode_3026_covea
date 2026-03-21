import express from "express";
import cors from "cors";

import { getPlayerDetails } from "./backend/player/playerService.js";
import { moveAndStore, getRuntimeState } from "./backend/game/moveAndStore.js";
import { upgradeMyStorage } from "./backend/deplacement/ameliorationentrepot.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Backend OK" });
});

app.get("/api/player", async (req, res) => {
  const result = await getPlayerDetails();

  if (!result.success) {
    return res.status(500).json(result);
  }

  res.json(result);
});

app.get("/api/state", (req, res) => {
  res.json({
    success: true,
    data: getRuntimeState()
  });
});

app.post("/api/move", async (req, res) => {
  const { direction } = req.body;

  if (!direction) {
    return res.status(400).json({
      success: false,
      error: "direction manquante"
    });
  }

  const result = await moveAndStore(direction);

  if (!result.success) {
    return res.status(500).json(result);
  }

  res.json(result);
});

app.post("/api/storage/upgrade", async (req, res) => {
  const result = await upgradeMyStorage();

  if (!result.success) {
    return res.status(500).json(result);
  }

  res.json(result);
});

app.listen(PORT, () => {
  console.log(`✅ Serveur backend lancé sur http://localhost:${PORT}`);
});