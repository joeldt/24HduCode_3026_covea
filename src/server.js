import express from "express";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Backend OK" });
});

app.post("/api/bootstrap", (req, res) => {
  res.json({
    success: true,
    data: {
      player: {
        name: "WANDA237",
        money: 500,
        quotient: 300,
        home: { name: "Ohara" },
        ship: { availableMove: 10 }
      },
      state: {
        position: { x: 0, y: 0 },
        energy: 10,
        knownCells: [],
        history: []
      }
    }
  });
});

app.post("/api/move", (req, res) => {
  const { direction } = req.body;

  if (!direction) {
    return res.status(400).json({
      success: false,
      error: "direction manquante"
    });
  }

  res.json({
    success: true,
    data: {
      position: { x: 1, y: 0 },
      energy: 9,
      knownCells: [
        { x: 1, y: 0, type: "SEA" },
        { x: 2, y: 0, type: "SEA" },
        { x: 1, y: 1, type: "SAND" }
      ],
      history: [
        {
          direction,
          position: { x: 1, y: 0 },
          energy: 9,
          discoveredCount: 3,
          timestamp: new Date().toISOString()
        }
      ]
    }
  });
});

app.post("/api/storage/upgrade", (req, res) => {
  res.json({
    success: true,
    data: {
      levelId: 2,
      maxResources: {
        FERONIUM: 1000,
        BOISIUM: 1000,
        CHARBONIUM: 1000
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Backend lancé sur http://localhost:${PORT}`);
});