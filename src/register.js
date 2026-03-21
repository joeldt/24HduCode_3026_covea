import { apiPost } from "./api.js";
import { TEAM_NAME, SIGNUP_CODE } from "./config.js";

export async function signupAndRegister() {
  if (!SIGNUP_CODE) {
    throw new Error("SIGNUP_CODE manquant dans .env");
  }

  console.log("Inscription de l'équipe...");

  const registerResponse = await apiPost(
    "/players/register",
    { name: TEAM_NAME },
    { "codinggame-signupcode": SIGNUP_CODE }
  );

  console.log("Réponse register:", registerResponse);

  const token = registerResponse.codingGameId || registerResponse.token;

  if (token) {
    console.log("TOKEN FINAL:", token);
    console.log("Copie ce token dans .env à la place de TOKEN=");
  } else {
    console.log("Aucun codingGameId trouvé dans la réponse.");
  }

  return registerResponse;
}