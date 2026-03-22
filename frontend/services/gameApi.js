const API = "/api";

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Erreur ${url}`);
  }

  return data;
}

export function bootstrapGame() {
  return request("/api/bootstrap", { method: "POST" });
}

export function moveBoat(direction) {
  return request("/api/move", {
    method: "POST",
    body: JSON.stringify({ direction })
  });
}

export function getMap() {
  return request("/api/map");
}

export function getMarketplaceOffers() {
  return request("/api/marketplace/offers");
}

export function createMarketplaceOffer(payload) {
  return request("/api/marketplace/offers", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function createMarketplacePurchase(payload) {
  return request("/api/marketplace/purchases", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}