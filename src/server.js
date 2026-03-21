import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let islandsDB = [];

// 🔥 SAVE ISLANDS
app.post("/islands", (req, res) => {
  islandsDB.push(req.body);
  console.log("ÎLE SAUVEGARDÉE :", req.body);
  res.json({ success: true });
});

// 🔥 GET ALL
app.get("/islands", (req, res) => {
  res.json(islandsDB);
});

app.listen(3001, () => console.log("Backend ON 3001"));