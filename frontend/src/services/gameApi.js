const API_URL = "http://localhost:3001";

export async function getState() {
  const res = await fetch(`${API_URL}/api/state`);
  const data = await res.json();

  if (!data.ok) {
    throw new Error(data.message || "Erreur récupération état");
  }

  return data.state;
}

export async function moveBoat(direction) {
  const res = await fetch(`${API_URL}/api/move`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ direction })
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(data.message || "Erreur déplacement");
  }

  return data.state;
}