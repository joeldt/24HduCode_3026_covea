import { useEffect, useMemo, useRef, useState } from "react";
import {
  bootstrapGame,
  moveBoat,
  getMap,
  getMarketplaceOffers,
  createMarketplaceOffer,
  createMarketplacePurchase
} from "../services/gameApi.js";

function mergeKnownCells(oldCells = [], newCells = []) {
  const merged = new Map();

  [...oldCells, ...newCells].forEach((cell) => {
    if (!cell || typeof cell.x !== "number" || typeof cell.y !== "number") return;
    merged.set(`${cell.x},${cell.y}`, cell);
  });

  return Array.from(merged.values());
}

function App() {
  const [player, setPlayer] = useState(null);
  const [runtimeState, setRuntimeState] = useState(null);
  const [offers, setOffers] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [error, setError] = useState("");
  const [loadingMove, setLoadingMove] = useState(false);

  const [offerForm, setOfferForm] = useState({
    resourceType: "BOISIUM",
    quantityIn: 100,
    pricePerResource: 1
  });

  const [purchaseForm, setPurchaseForm] = useState({
    offerId: "",
    quantity: 1
  });

  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [autoTradeStatus, setAutoTradeStatus] = useState("Inactif");

  const hasLoadedRef = useRef(false);
  const marketCacheRef = useRef({
    data: [],
    lastFetch: 0,
    cooldown: 4000
  });

  const autoTradeRef = useRef({
    lastRun: 0,
    cooldown: 25000
  });

  async function getSafeMarketplaceOffers(force = false) {
    const now = Date.now();

    if (!force && now - marketCacheRef.current.lastFetch < marketCacheRef.current.cooldown) {
      return { data: marketCacheRef.current.data };
    }

    try {
      const result = await getMarketplaceOffers();
      const safeData = Array.isArray(result?.data) ? result.data : [];

      marketCacheRef.current = {
        data: safeData,
        lastFetch: now,
        cooldown: 4000
      };

      return { data: safeData };
    } catch (err) {
      console.warn("Marketplace rate limit -> fallback cache", err);
      marketCacheRef.current.cooldown = 8000;
      return { data: marketCacheRef.current.data };
    }
  }

  function getResourceQuantity(type) {
    const resources = Array.isArray(player?.resources) ? player.resources : [];
    const found = resources.find((r) => r.type === type);
    return found?.quantity ?? 0;
  }

  function chooseAutoSellResource() {
    const boisium = getResourceQuantity("BOISIUM");
    const feronium = getResourceQuantity("FERONIUM");
    const charbonium = getResourceQuantity("CHARBONIUM");

    const stock = [
      { type: "BOISIUM", quantity: boisium, minKeep: 1500, sellPack: 300, price: 2 },
      { type: "FERONIUM", quantity: feronium, minKeep: 3000, sellPack: 500, price: 5 },
      { type: "CHARBONIUM", quantity: charbonium, minKeep: 1200, sellPack: 250, price: 4 }
    ];

    const candidates = stock
      .filter((r) => r.quantity > r.minKeep + r.sellPack)
      .sort((a, b) => b.quantity - a.quantity);

    return candidates[0] || null;
  }

  function chooseAutoBuyOffer() {
    const safeOffers = Array.isArray(offers) ? offers : [];

    const boisium = getResourceQuantity("BOISIUM");
    const feronium = getResourceQuantity("FERONIUM");
    const charbonium = getResourceQuantity("CHARBONIUM");

    const targets = [
      { type: "BOISIUM", quantity: boisium, minNeed: 1000, maxPrice: 4 },
      { type: "FERONIUM", quantity: feronium, minNeed: 2500, maxPrice: 8 },
      { type: "CHARBONIUM", quantity: charbonium, minNeed: 800, maxPrice: 6 }
    ];

    const missing = targets.find((t) => t.quantity < t.minNeed);
    if (!missing) return null;

    const matchingOffers = safeOffers
      .filter((offer) => {
        const type = offer.resourceType || offer.type;
        const price = Number(offer.pricePerResource || offer.price || 999999);
        const qty = Number(offer.quantityIn || offer.quantity || 0);
        const seller = offer.owner?.name || offer.seller?.name || "";

        return (
          type === missing.type &&
          price <= missing.maxPrice &&
          qty > 0 &&
          seller !== (player?.name || "")
        );
      })
      .sort((a, b) => {
        const pa = Number(a.pricePerResource || a.price || 999999);
        const pb = Number(b.pricePerResource || b.price || 999999);

        if (pa !== pb) return pa - pb;

        const qa = Number(a.quantityIn || a.quantity || 0);
        const qb = Number(b.quantityIn || b.quantity || 0);

        return qa - qb;
      });

    return matchingOffers[0] || null;
  }

  function findMyExistingOffer(resourceType) {
    const safeOffers = Array.isArray(offers) ? offers : [];

    return safeOffers.find((offer) => {
      const seller = offer.owner?.name || offer.seller?.name || "";
      const type = offer.resourceType || offer.type || "";
      const qty = Number(offer.quantityIn || offer.quantity || 0);

      return seller === (player?.name || "") && type === resourceType && qty > 0;
    });
  }

  async function runAutoTrade() {
    const now = Date.now();

    if (now - autoTradeRef.current.lastRun < autoTradeRef.current.cooldown) {
      return;
    }

    autoTradeRef.current.lastRun = now;

    try {
      setAutoTradeStatus("Analyse des ressources...");

      const resourceToSell = chooseAutoSellResource();

      if (resourceToSell) {
        const existingOffer = findMyExistingOffer(resourceToSell.type);

        if (existingOffer) {
          setAutoTradeStatus(
            `Vente déjà en cours: ${resourceToSell.type} (#${existingOffer.id || "-"})`
          );
          return;
        }

        setAutoTradeStatus(`Vente auto: ${resourceToSell.type}`);

        if (!resourceToSell.type || !resourceToSell.sellPack || !resourceToSell.price) {
          setAutoTradeStatus("Erreur auto-trade: vente invalide");
          return;
        }

        const created = await createMarketplaceOffer({
          resourceType: resourceToSell.type,
          quantityIn: resourceToSell.sellPack,
          pricePerResource: resourceToSell.price
        });

        const createdData = created?.data ?? created ?? null;
        if (createdData) {
          setMyOffers((prev) => [createdData, ...prev]);
        }

        const market = await getSafeMarketplaceOffers(true);
        setOffers(Array.isArray(market?.data) ? market.data : []);

        await loadInitialData();
        setAutoTradeStatus(`Offre publiée: ${resourceToSell.type}`);
        return;
      }

      const offerToBuy = chooseAutoBuyOffer();

      if (offerToBuy) {
        const offerId = offerToBuy.id;
        const availableQty = Number(offerToBuy.quantityIn || offerToBuy.quantity || 0);
        const price = Number(offerToBuy.pricePerResource || offerToBuy.price || 999999);

        let quantity = 0;

        if (price <= 2) {
          quantity = Math.min(availableQty, 100);
        } else if (price <= 4) {
          quantity = Math.min(availableQty, 50);
        } else if (price <= 6) {
          quantity = Math.min(availableQty, 25);
        } else {
          quantity = Math.min(availableQty, 10);
        }

        if (!offerId || quantity <= 0) {
          setAutoTradeStatus("Erreur auto-trade: achat invalide");
          return;
        }

        setAutoTradeStatus(
          `Achat auto: ${offerToBuy.resourceType || offerToBuy.type} x${quantity}`
        );

        await createMarketplacePurchase({
          offerId,
          quantity
        });

        const market = await getSafeMarketplaceOffers(true);
        setOffers(Array.isArray(market?.data) ? market.data : []);

        await loadInitialData();
        setAutoTradeStatus(
          `Achat effectué: ${offerToBuy.resourceType || offerToBuy.type} x${quantity}`
        );
        return;
      }

      setAutoTradeStatus("Aucune action nécessaire");
    } catch (err) {
      console.error("Erreur auto trade :", err);
      setAutoTradeStatus(`Erreur auto-trade: ${err.message}`);
    }
  }

  async function loadInitialData() {
    try {
      setError("");

      const boot = await bootstrapGame();
      const map = await getMap();
      const market = await getSafeMarketplaceOffers();

      const knownCells = Array.isArray(map?.data)
        ? map.data.map((c) => ({
            x: c.x,
            y: c.y,
            type: c.type
          }))
        : Array.isArray(map)
          ? map.map((c) => ({
              x: c.x,
              y: c.y,
              type: c.type
            }))
          : [];

      const playerData = boot?.data?.player ?? boot?.player ?? null;
      const stateData = boot?.data?.state ?? boot?.state ?? {};

      setPlayer(playerData);
      setRuntimeState({
        ...stateData,
        knownCells
      });

      if (market?.data) {
        setOffers(Array.isArray(market.data) ? market.data : []);
      }
    } catch (err) {
      console.error("Erreur loadInitialData :", err);
      setError(err.message);
    }
  }

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadInitialData();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const market = await getSafeMarketplaceOffers();
      if (market?.data) {
        setOffers(Array.isArray(market.data) ? market.data : []);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!autoTradeEnabled) return;

    const interval = setInterval(() => {
      runAutoTrade();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoTradeEnabled, offers, player]);

  async function handleMove(direction) {
    if (loadingMove) return;

    setLoadingMove(true);

    try {
      setError("");
      const result = await moveBoat(direction);
      const moveData = result?.data ?? result ?? {};

      setRuntimeState((prev) => {
        const previousCells = Array.isArray(prev?.knownCells) ? prev.knownCells : [];
        const incomingCells = Array.isArray(moveData.knownCells)
          ? moveData.knownCells
          : Array.isArray(moveData.discoveredCells)
            ? moveData.discoveredCells
            : [];

        return {
          ...(prev || {}),
          ...moveData,
          knownCells: mergeKnownCells(previousCells, incomingCells),
          history: Array.isArray(moveData.history)
            ? moveData.history
            : Array.isArray(prev?.history)
              ? prev.history
              : []
        };
      });
    } catch (err) {
      console.error("Erreur move :", err);
      setError(err.message);
    } finally {
      setTimeout(() => {
        setLoadingMove(false);
      }, 5000);
    }
  }

  async function handleCreateOffer(e) {
    e.preventDefault();

    try {
      setError("");

      const created = await createMarketplaceOffer({
        resourceType: offerForm.resourceType,
        quantityIn: Number(offerForm.quantityIn),
        pricePerResource: Number(offerForm.pricePerResource)
      });

      const createdData = created?.data ?? created ?? null;
      if (createdData) {
        setMyOffers((prev) => [createdData, ...prev]);
      }

      const market = await getSafeMarketplaceOffers(true);
      setOffers(Array.isArray(market?.data) ? market.data : []);

      await loadInitialData();
    } catch (err) {
      console.error("Erreur create offer :", err);
      setError(err.message);
    }
  }

  async function handlePurchase(e) {
    e.preventDefault();

    try {
      setError("");

      await createMarketplacePurchase({
        offerId: purchaseForm.offerId,
        quantity: Number(purchaseForm.quantity)
      });

      const market = await getSafeMarketplaceOffers(true);
      setOffers(Array.isArray(market?.data) ? market.data : []);

      await loadInitialData();
    } catch (err) {
      console.error("Erreur purchase :", err);
      setError(err.message);
    }
  }

  const displayState = useMemo(() => {
    const playerData = player || {};
    const stateData = runtimeState || {};

    const knownCells = Array.isArray(stateData.knownCells) ? stateData.knownCells : [];
    const history = Array.isArray(stateData.history) ? stateData.history : [];
    const discoveredIslands = Array.isArray(playerData.discoveredIslands)
      ? playerData.discoveredIslands
      : [];
    const resources = Array.isArray(playerData.resources)
      ? playerData.resources
      : [];

    const sandCells = knownCells.filter((c) => c.type === "SAND");

    const detectedIslands = sandCells.map((cell, index) => ({
      id: index,
      coords: { x: cell.x, y: cell.y }
    }));

    const discoveredIslandsCount = detectedIslands.length;

    return {
      boat: {
        x: stateData.position?.x ?? 0,
        y: stateData.position?.y ?? 0,
        energy: stateData.energy ?? playerData.ship?.availableMove ?? 0
      },
      player: {
        name: playerData.name || "-",
        money: playerData.money ?? "-",
        quotient: playerData.quotient ?? "-",
        home: playerData.home?.name || "-"
      },
      resources,
      knownCells,
      history,
      discoveredIslands,
      detectedIslands,
      discoveredIslandsCount,
      offers: Array.isArray(offers) ? offers : [],
      myOffers: Array.isArray(myOffers) ? myOffers : []
    };
  }, [player, runtimeState, offers, myOffers]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "white",
        padding: "20px",
        display: "grid",
        gridTemplateColumns: "280px 1fr 340px 320px",
        gap: "20px",
        fontFamily: "Arial"
      }}
    >
      <aside>
        <h1>3026 - Cartographie</h1>

        {error && (
          <div
            style={{
              background: "#4a1111",
              color: "#ff6b6b",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
              lineHeight: 1.4,
              wordBreak: "break-word"
            }}
          >
            {error}
          </div>
        )}

        <section style={card}>
          <h2>Bateau</h2>
          <p>
            Position: ({displayState.boat.x}, {displayState.boat.y})
          </p>
          <p>Énergie: {displayState.boat.energy}</p>
          <p>Cases connues: {displayState.knownCells.length}</p>
        </section>

        <section style={card}>
          <h2>Joueur</h2>
          <p>👤 {displayState.player.name}</p>
          <p>💰 {displayState.player.money}</p>
          <p>⚖️ {displayState.player.quotient}</p>
          <p>🏝 {displayState.player.home}</p>
          <p>🏝 Îles découvertes : {displayState.discoveredIslandsCount}</p>

          <h3 style={{ marginTop: "12px", marginBottom: "8px" }}>Ressources</h3>

          {displayState.resources.length === 0 ? (
            <p>Aucune ressource.</p>
          ) : (
            displayState.resources.map((resource, i) => (
              <p key={`${resource.type}-${i}`}>
                {resource.type} : {resource.quantity}
              </p>
            ))
          )}
        </section>

        <section style={card}>
          <h2>Déplacements</h2>

          <button onClick={() => handleMove("N")} disabled={loadingMove} style={moveButton}>
            Move N
          </button>

          <button onClick={() => handleMove("S")} disabled={loadingMove} style={moveButton}>
            Move S
          </button>

          <button onClick={() => handleMove("E")} disabled={loadingMove} style={moveButton}>
            Move E
          </button>

          <button onClick={() => handleMove("W")} disabled={loadingMove} style={moveButton}>
            Move W
          </button>

          {loadingMove && <p>Cooldown 5s...</p>}
        </section>
      </aside>

      <main style={{ overflow: "auto" }}>
        <MapGrid
          knownCells={displayState.knownCells}
          boatX={displayState.boat.x}
          boatY={displayState.boat.y}
        />
      </main>

      <aside style={marketPanel}>
        <h2>Transactions Marketplace</h2>

        <section style={card}>
          <h3>Auto Trade</h3>

          <button
            onClick={() => setAutoTradeEnabled((prev) => !prev)}
            style={{
              ...actionButton,
              background: autoTradeEnabled ? "#1f8f4e" : "#2f6fed",
              marginBottom: "10px"
            }}
          >
            {autoTradeEnabled ? "Désactiver auto-trade" : "Activer auto-trade"}
          </button>

          <p style={{ margin: 0 }}>
            <strong>Statut :</strong> {autoTradeStatus}
          </p>
          <p style={{ marginTop: "6px" }}>
            <strong>Activé :</strong> {autoTradeEnabled ? "Oui" : "Non"}
          </p>
        </section>

        <section style={card}>
          <h3>Créer une offre</h3>
          <form onSubmit={handleCreateOffer}>
            <select
              value={offerForm.resourceType}
              onChange={(e) =>
                setOfferForm((prev) => ({ ...prev, resourceType: e.target.value }))
              }
              style={inputStyle}
            >
              <option value="BOISIUM">BOISIUM</option>
              <option value="FERONIUM">FERONIUM</option>
              <option value="CHARBONIUM">CHARBONIUM</option>
            </select>

            <input
              type="number"
              value={offerForm.quantityIn}
              onChange={(e) =>
                setOfferForm((prev) => ({ ...prev, quantityIn: e.target.value }))
              }
              placeholder="Quantité"
              style={inputStyle}
            />

            <input
              type="number"
              value={offerForm.pricePerResource}
              onChange={(e) =>
                setOfferForm((prev) => ({ ...prev, pricePerResource: e.target.value }))
              }
              placeholder="Prix unitaire"
              style={inputStyle}
            />

            <button type="submit" style={actionButton}>
              Publier offre
            </button>
          </form>
        </section>

        <section style={card}>
          <h3>Acheter une offre</h3>
          <form onSubmit={handlePurchase}>
            <input
              type="text"
              value={purchaseForm.offerId}
              onChange={(e) =>
                setPurchaseForm((prev) => ({ ...prev, offerId: e.target.value }))
              }
              placeholder="Offer ID"
              style={inputStyle}
            />

            <input
              type="number"
              value={purchaseForm.quantity}
              onChange={(e) =>
                setPurchaseForm((prev) => ({ ...prev, quantity: e.target.value }))
              }
              placeholder="Quantité"
              style={inputStyle}
            />

            <button type="submit" style={actionButton}>
              Acheter
            </button>
          </form>
        </section>

        <section style={card}>
          <h3>Mes offres</h3>
          {displayState.myOffers.length === 0 ? (
            <p>Aucune offre créée.</p>
          ) : (
            displayState.myOffers.map((offer, index) => (
              <div key={offer.id || `mine-${index}`} style={logCard}>
                <div><strong>ID :</strong> {offer.id || "-"}</div>
                <div><strong>Ressource :</strong> {offer.resourceType || offer.type || "-"}</div>
                <div><strong>Quantité :</strong> {offer.quantityIn || offer.quantity || "-"}</div>
                <div><strong>Prix :</strong> {offer.pricePerResource || offer.price || "-"}</div>
              </div>
            ))
          )}
        </section>

        <section style={card}>
          <h3>Offres en cours</h3>
          {displayState.offers.length === 0 ? (
            <p>Aucune offre.</p>
          ) : (
            displayState.offers.map((offer, index) => (
              <div key={offer.id || index} style={logCard}>
                <div><strong>ID :</strong> {offer.id || "-"}</div>
                <div><strong>Vendeur :</strong> {offer.owner?.name || "-"}</div>
                <div><strong>Ressource :</strong> {offer.resourceType || offer.type || "-"}</div>
                <div><strong>Quantité :</strong> {offer.quantityIn || offer.quantity || "-"}</div>
                <div><strong>Prix :</strong> {offer.pricePerResource || offer.price || "-"}</div>
              </div>
            ))
          )}
        </section>
      </aside>

      <aside style={rightPanel}>
        <h2>Historique déplacements</h2>

        {displayState.history.length === 0 ? (
          <p>Aucun déplacement.</p>
        ) : (
          displayState.history
            .slice()
            .reverse()
            .map((move, i) => (
              <div key={`${move.timestamp || "t"}-${i}`} style={logCard}>
                <strong>{move.direction || "-"}</strong>
                <div>
                  📍 ({move.position?.x ?? 0},{move.position?.y ?? 0})
                </div>
                <div>⚡ {move.energy ?? "-"}</div>
                <div>
                  🕒 {move.timestamp ? new Date(move.timestamp).toLocaleTimeString() : "-"}
                </div>
              </div>
            ))
        )}

        <h2 style={{ marginTop: "20px" }}>Îles connues</h2>

        {displayState.discoveredIslands.length === 0 ? (
          <p>Aucune île connue.</p>
        ) : (
          displayState.discoveredIslands.map((entry, i) => (
            <div key={`${entry.island?.name || "ile"}-${i}`} style={logCard}>
              <strong>🏝 {entry.island?.name || "Île inconnue"}</strong>
              <div>État : {entry.islandState || "-"}</div>
              <div>Bonus : {entry.island?.bonusQuotient ?? 0}</div>
              {entry.island?.x !== undefined && entry.island?.y !== undefined && (
                <div>
                  ({entry.island.x},{entry.island.y})
                </div>
              )}
            </div>
          ))
        )}

        <h2 style={{ marginTop: "20px" }}>Îles détectées sur la carte</h2>

        {displayState.detectedIslands.length === 0 ? (
          <p>Aucune île détectée.</p>
        ) : (
          displayState.detectedIslands.map((island) => (
            <div key={island.id} style={logCard}>
              <strong>🏝 Île détectée</strong>
              <div>
                📍Coordonnées : ({island.coords.x}, {island.coords.y})
              </div>
              <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>
                X={island.coords.x} | Y={island.coords.y}
              </div>
            </div>
          ))
        )}
      </aside>
    </div>
  );
}

const card = {
  background: "#171717",
  padding: "15px",
  borderRadius: "10px",
  marginBottom: "10px"
};

const marketPanel = {
  background: "#171717",
  padding: "15px",
  borderRadius: "10px",
  maxHeight: "90vh",
  overflowY: "auto"
};

const rightPanel = {
  background: "#171717",
  padding: "15px",
  borderRadius: "10px",
  maxHeight: "90vh",
  overflowY: "auto"
};

const logCard = {
  background: "#0f0f0f",
  padding: "10px",
  borderRadius: "8px",
  marginBottom: "8px"
};

const moveButton = {
  display: "block",
  width: "100%",
  marginBottom: "8px",
  padding: "10px",
  background: "#2f6fed",
  border: "none",
  borderRadius: "8px",
  color: "white"
};

const inputStyle = {
  width: "100%",
  marginBottom: "8px",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #333",
  background: "#0f0f0f",
  color: "white"
};

const actionButton = {
  width: "100%",
  padding: "10px",
  background: "#2f6fed",
  border: "none",
  borderRadius: "8px",
  color: "white"
};

function MapGrid({ knownCells, boatX, boatY }) {
  const size = 95;
  const cellSize = 20;

  const cellMap = new Map();
  knownCells.forEach((c) => cellMap.set(`${c.x},${c.y}`, c));

  const cells = [];

  for (let y = size; y >= -size; y--) {
    for (let x = -size; x <= size; x++) {
      const cell = cellMap.get(`${x},${y}`);

      let bg = "#222";
      if (cell?.type === "SEA") bg = "#3ea6ff";
      if (cell?.type === "SAND") bg = "#d9c36a";
      if (cell?.type === "ROCKS") bg = "#888";

      const isBoat = x === boatX && y === boatY;

      cells.push(
        <div
          key={`${x}-${y}`}
          style={{
            width: cellSize,
            height: cellSize,
            background: isBoat ? "#ff4d4f" : bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "3px"
          }}
        >
          {isBoat ? "⛵" : ""}
        </div>
      );
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${size * 2 + 1}, ${cellSize}px)`,
        gap: "2px"
      }}
    >
      {cells}
    </div>
  );
}

export default App;