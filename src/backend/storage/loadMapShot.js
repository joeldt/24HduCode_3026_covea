import fs from "fs";
import path from "path";
import { loadMapFromObject } from "../map/mapStore.js";

const SAVE_FILE = path.resolve("data", "mapSnapshot.json");

export function loadMapShot() {
  if (!fs.existsSync(SAVE_FILE)) {
    return null;
  }

  const raw = fs.readFileSync(SAVE_FILE, "utf-8");
  const data = JSON.parse(raw);

  if (data.map) {
    loadMapFromObject(data.map);
  }

  return data;
}