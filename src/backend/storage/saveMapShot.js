import fs from "fs";
import path from "path";
import { getMapAsObject } from "../map/mapStore.js";
import { getRuntimeState } from "../game/moveAndStore.js";

const SAVE_DIR = path.resolve("data");
const SAVE_FILE = path.join(SAVE_DIR, "mapSnapshot.json");

export function saveMapShot() {
  if (!fs.existsSync(SAVE_DIR)) {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
  }

  const payload = {
    savedAt: new Date().toISOString(),
    map: getMapAsObject(),
    runtime: getRuntimeState()
  };

  fs.writeFileSync(SAVE_FILE, JSON.stringify(payload, null, 2), "utf-8");

  return SAVE_FILE;
}