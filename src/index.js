import { signupAndRegister } from "./register.js";

async function main() {
  try {
    const result = await signupAndRegister();
    console.log("Inscription réussie !");
    console.log(result);
  } catch (error) {
    console.error("Erreur :", error.message);
  }
}

main();