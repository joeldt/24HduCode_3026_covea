const API_BASE_URL = "http://localhost:3001/api";

export async function fetchPlayer() {
  const res = await fetch(`${API_BASE_URL}/player`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Erreur récupération joueur");
  }

  return data;
}

export async function fetchState() {
  const res = await fetch(`${API_BASE_URL}/state`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Erreur récupération état");
  }

  return data;
}

export async function moveBoat(direction) {
  const res = await fetch(`${API_BASE_URL}/move`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ direction })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Erreur déplacement");
  }

  return data;
}

export async function upgradeStorage() {
  const res = await fetch(`${API_BASE_URL}/storage/upgrade`, {
    method: "POST"
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Erreur amélioration entrepôt");
  }

  return data;
}