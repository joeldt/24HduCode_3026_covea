const API_BASE_URL = "http://localhost:3001/api";

async function postJson(path, body = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Erreur ${path}`);
  }

  return data;
}

export async function bootstrapGame() {
  return await postJson("/bootstrap", {});
}

export async function moveBoat(direction) {
  return await postJson("/move", { direction });
}

export async function upgradeStorage() {
  return await postJson("/storage/upgrade", {});
}