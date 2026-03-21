import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const BASE_URL = process.env.BASE_URL;
export const TEAM_NAME = process.env.TEAM_NAME;
export const SIGNUP_CODE = process.env.SIGNUP_CODE;
export const TOKEN = process.env.TOKEN;