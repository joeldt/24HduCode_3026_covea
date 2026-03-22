import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { apiGet, apiPost } from "./api.js";

const app = express();
app.use(cors());
app.use(express.json());

async function getAllMapCells() {
  let allRows = [];
  let from = 0;
  const pageSize = 1000;
  let keepGoing = true;

  while (keepGoing) {
    const { data, error } = await supabase
      .from("map_cells")
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) throw error;

    const rows = data || [];
    allRows = allRows.concat(rows);

    if (rows.length < pageSize) {
      keepGoing = false;
    } else {
      from += pageSize;
    }
  }

  return allRows;
}
const supabase = createClient(
  "https://aqrpqnabkuphpwrieaea.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcnBxbmFia3VwaHB3cmllYWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDAzMDAsImV4cCI6MjA4OTY3NjMwMH0.0JOm0DvZpDMO8bVJfQPIsXeByJRchq1Wf2D1_TK4-MU"
);

let gameState = {
  position: { x: 0, y: 0 },
  energy: 20,
  history: []
};
app.post("/api/bootstrap", async (req, res) => {
  try {
    const data = await getAllMapCells();

    const playerDetails = await apiGet("/players/details").catch(() => null);

    res.json({
      data: {
        player: playerDetails || {
          name: "WANDA237",
          money: 500,
          quotient: 300,
          home: { name: "Ohara" },
          discoveredIslands: []
        },
        state: {
          ...gameState,
          knownCells: data || []
        }
      }
    });
  } catch (err) {
    console.error("BOOTSTRAP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/map", async (req, res) => {
  try {
    let allRows = [];
    let from = 0;
    const pageSize = 1000;
    let keepGoing = true;

    while (keepGoing) {
      const { data, error } = await supabase
        .from("map_cells")
        .select("*")
        .range(from, from + pageSize - 1);

      if (error) throw error;

      const rows = data || [];
      allRows = allRows.concat(rows);

      if (rows.length < pageSize) {
        keepGoing = false;
      } else {
        from += pageSize;
      }
    }

    res.json(allRows);
  } catch (err) {
    console.error("MAP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/move", async (req, res) => {
  const { direction } = req.body;

  try {
    const moveResponse = await apiPost("/ship/move", { direction });

    gameState.position = moveResponse.position || gameState.position;
    gameState.energy = moveResponse.energy ?? gameState.energy;

    gameState.history.push({
      direction,
      position: gameState.position,
      energy: gameState.energy,
      timestamp: new Date().toISOString()
    });

    res.json({
      data: {
        position: gameState.position,
        energy: moveResponse.energy ?? gameState.energy,
        knownCells: moveResponse.discoveredCells || [],
        history: gameState.history
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marketplace
app.get("/api/marketplace/offers", async (req, res) => {
  try {
    const offers = await apiGet("/marketplace/offers");
    res.json({ data: offers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/marketplace/offers", async (req, res) => {
  try {
    const created = await apiPost("/marketplace/offers", req.body);
    res.json({ data: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/marketplace/purchases", async (req, res) => {
  try {
    const purchase = await apiPost("/marketplace/purchases", req.body);
    res.json({ data: purchase });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log("✅ Serveur prêt sur http://localhost:3001");
});