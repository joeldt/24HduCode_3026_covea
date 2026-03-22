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

function analyzeStrategicZones(knownCells = [], boat = { x: 0, y: 0 }) {
  const cells = Array.isArray(knownCells) ? knownCells : [];

  const sandCells = cells.filter((c) => c.type === "SAND");
  const seaCells = cells.filter((c) => c.type === "SEA");
  const rocksCells = cells.filter((c) => c.type === "ROCKS");

  const frontierCandidates = [];
  const knownSet = new Set(cells.map((c) => `${c.x},${c.y}`));

  for (const cell of cells) {
    const neighbors = [
      { x: cell.x + 1, y: cell.y },
      { x: cell.x - 1, y: cell.y },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x, y: cell.y - 1 }
    ];

    const hasUnknownNeighbor = neighbors.some((n) => !knownSet.has(`${n.x},${n.y}`));

    if (hasUnknownNeighbor) {
      frontierCandidates.push(cell);
    }
  }

  let bestTarget = null;
  let bestScore = -Infinity;

  for (const cell of frontierCandidates) {
    const distance = Math.abs(cell.x - boat.x) + Math.abs(cell.y - boat.y);
    const terrainBonus =
      cell.type === "SAND" ? 30 : cell.type === "SEA" ? 15 : 0;

    const frontierBonus = 20;
    const score = terrainBonus + frontierBonus - distance;

    if (score > bestScore) {
      bestScore = score;
      bestTarget = cell;
    }
  }

  const centerSand =
    sandCells.length > 0
      ? {
          x: Math.round(sandCells.reduce((sum, c) => sum + c.x, 0) / sandCells.length),
          y: Math.round(sandCells.reduce((sum, c) => sum + c.y, 0) / sandCells.length)
        }
      : null;

  return {
    bestTarget,
    bestScore,
    frontierCount: frontierCandidates.length,
    sandCount: sandCells.length,
    seaCount: seaCells.length,
    rocksCount: rocksCells.length,
    centerSand,
    mode:
      frontierCandidates.length > 0
        ? "EXPLORATION INTELLIGENTE"
        : "OPTIMISATION / CONSOLIDATION",
    advice:
      frontierCandidates.length > 0
        ? "Se diriger vers une frontière pour découvrir de nouvelles zones."
        : "Explorer autour des îles détectées ou optimiser le trade."
  };
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
  const [explorationMode] = useState("SPIRALE");
  const [brokerStatus] = useState("Actif");
  const [strategyGoal] = useState("Découvrir de nouvelles zones et optimiser les ressources");

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

  function getMarketStats(type) {
    const filtered = (Array.isArray(offers) ? offers : []).filter(
      (o) => (o.resourceType || o.type) === type
    );

    if (filtered.length === 0) return null;

    const prices = filtered.map((o) => Number(o.pricePerResource || o.price || 0)).filter(Boolean);

    if (prices.length === 0) return null;

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      count: filtered.length
    };
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
            type: c.type,
            island_name: c.island_name || c.islandName || "",
            islandName: c.islandName || c.island_name || ""
          }))
        : Array.isArray(map)
          ? map.map((c) => ({
              x: c.x,
              y: c.y,
              type: c.type,
              island_name: c.island_name || c.islandName || "",
              islandName: c.islandName || c.island_name || ""
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
        const incomingRawCells = Array.isArray(moveData.knownCells)
          ? moveData.knownCells
          : Array.isArray(moveData.discoveredCells)
            ? moveData.discoveredCells
            : [];

        const incomingCells = incomingRawCells.map((c) => ({
          x: c.x,
          y: c.y,
          type: c.type,
          island_name: c.island_name || c.islandName || "",
          islandName: c.islandName || c.island_name || ""
        }));

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
    console.log(
      "SAND COORDS =",
      sandCells.map((c) => ({ x: c.x, y: c.y }))
    );

    const detectedIslands = sandCells.map((cell, index) => ({
      id: index,
      coords: { x: cell.x, y: cell.y }
    }));

    const discoveredIslandsCount = detectedIslands.length;
    const totalResources = resources.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
    const scoreStrategique = Math.round(
      knownCells.length + discoveredIslandsCount * 40 + Number(playerData.money || 0) / 100
    );

    const strategyAnalysis = analyzeStrategicZones(knownCells, {
      x: stateData.position?.x ?? 0,
      y: stateData.position?.y ?? 0
    });

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
      totalResources,
      scoreStrategique,
      strategyAnalysis,
      offers: Array.isArray(offers) ? offers : [],
      myOffers: Array.isArray(myOffers) ? myOffers : []
    };
  }, [player, runtimeState, offers, myOffers]);

  const boisiumStats = getMarketStats("BOISIUM");
  const feroniumStats = getMarketStats("FERONIUM");
  const charboniumStats = getMarketStats("CHARBONIUM");

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(30,40,70,0.55) 0%, rgba(0,0,0,1) 45%)",
        color: "white",
        padding: "20px",
        display: "grid",
        gridTemplateColumns: "300px 1fr 360px 340px",
        gap: "20px",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <aside>
        <h1 style={{ marginTop: 0, marginBottom: "18px", lineHeight: 1.05 }}>
          3026 -<br />
          Cartographie
        </h1>

        {error && (
          <div
            style={{
              background: "#4a1111",
              color: "#ff6b6b",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "10px",
              lineHeight: 1.4,
              wordBreak: "break-word",
              border: "1px solid rgba(255,107,107,0.25)"
            }}
          >
            {error}
          </div>
        )}

        <section style={card}>
          <h2>Bateau</h2>
          <p>Position: ({displayState.boat.x}, {displayState.boat.y})</p>
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
          <p>📦 Ressources totales : {displayState.totalResources}</p>
          <p>🏆 Score stratégique : {displayState.scoreStrategique}</p>

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
          <h2>Stratégie</h2>
          <p>🧠 Mode exploration : {explorationMode}</p>
          <p>🎯 Objectif : {strategyGoal}</p>
          <p>🤖 Broker : {brokerStatus}</p>
          <p>💹 Auto trade : {autoTradeEnabled ? "Actif" : "Inactif"}</p>
          <p>⚡ Dernière action bot : {autoTradeStatus}</p>
          <p>🗺️ Cellules explorées : {displayState.knownCells.length}</p>
          <p>🏝 Îles détectées : {displayState.discoveredIslandsCount}</p>
        </section>

        <section style={card}>
          <h2>🧠 Radar stratégique</h2>

          {!displayState.strategyAnalysis ? (
            <p>Analyse en cours...</p>
          ) : (
            <>
              <p><strong>Mode :</strong> {displayState.strategyAnalysis.mode}</p>
              <p><strong>Conseil :</strong> {displayState.strategyAnalysis.advice}</p>
              <p><strong>Frontières détectées :</strong> {displayState.strategyAnalysis.frontierCount}</p>
              <p><strong>Zones sable :</strong> {displayState.strategyAnalysis.sandCount}</p>
              <p><strong>Zones mer :</strong> {displayState.strategyAnalysis.seaCount}</p>
              <p><strong>Zones rochers :</strong> {displayState.strategyAnalysis.rocksCount}</p>

              {displayState.strategyAnalysis.bestTarget && (
                <p>
                  <strong>🎯 Cible recommandée :</strong>{" "}
                  ({displayState.strategyAnalysis.bestTarget.x}, {displayState.strategyAnalysis.bestTarget.y})
                </p>
              )}

              {displayState.strategyAnalysis.centerSand && (
                <p>
                  <strong>🏝 Centre des îles :</strong>{" "}
                  ({displayState.strategyAnalysis.centerSand.x}, {displayState.strategyAnalysis.centerSand.y})
                </p>
              )}
            </>
          )}
        </section>

        <section style={card}>
          <h2>📋 Résumé mission</h2>
          <p>Broker : {brokerStatus}</p>
          <p>Auto trade : {autoTradeEnabled ? "Actif" : "Inactif"}</p>
          <p>Dernière action : {autoTradeStatus}</p>
          <p>Objectif courant : {displayState.strategyAnalysis?.advice || "-"}</p>
        </section>

        <section style={card}>
          <h2>Déplacements</h2>

          <div style={moveGrid}>
            <button onClick={() => handleMove("N")} disabled={loadingMove} style={moveButton}>
              ↑ N
            </button>
            <button onClick={() => handleMove("S")} disabled={loadingMove} style={moveButton}>
              ↓ S
            </button>
            <button onClick={() => handleMove("E")} disabled={loadingMove} style={moveButton}>
              → E
            </button>
            <button onClick={() => handleMove("W")} disabled={loadingMove} style={moveButton}>
              ← W
            </button>
          </div>

          {loadingMove && <p style={{ marginTop: "8px" }}>Cooldown 5s...</p>}
        </section>
      </aside>

      <main style={{ overflow: "auto", ...card, padding: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <h2 style={{ margin: 0 }}>Carte</h2>
          <div style={{ fontSize: "14px", color: "#b8c4ff" }}>
            Zone connue : {displayState.knownCells.length} cases
          </div>
        </div>

        <MapGrid
          knownCells={displayState.knownCells}
          boatX={displayState.boat.x}
          boatY={displayState.boat.y}
          targetCell={displayState.strategyAnalysis?.bestTarget}
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
          <h3>Analyse Marché</h3>
          <MarketStatLine label="BOISIUM" stats={boisiumStats} />
          <MarketStatLine label="FERONIUM" stats={feroniumStats} />
          <MarketStatLine label="CHARBONIUM" stats={charboniumStats} />
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
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {displayState.history
              .slice()
              .reverse()
              .map((move, i) => (
                <div key={`${move.timestamp || "t"}-${i}`} style={historyCard}>
                  <div style={historyTopRow}>
                    <strong style={{ color: "#7db8ff" }}>{move.direction || "-"}</strong>
                    <span style={historyTime}>
                      {move.timestamp ? new Date(move.timestamp).toLocaleTimeString() : "-"}
                    </span>
                  </div>
                  <div>📍 Position : ({move.position?.x ?? 0}, {move.position?.y ?? 0})</div>
                  <div>⚡ Énergie restante : {move.energy ?? "-"}</div>
                </div>
              ))}
          </div>
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
                <div>Coordonnées : ({entry.island.x}, {entry.island.y})</div>
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
              <div>📍 Coordonnées : ({island.coords.x}, {island.coords.y})</div>
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

function MarketStatLine({ label, stats }) {
  if (!stats) {
    return (
      <p style={{ margin: "6px 0" }}>
        {label} : pas de données
      </p>
    );
  }

  return (
    <div style={{ marginBottom: "8px", lineHeight: 1.45 }}>
      <strong>{label}</strong>
      <div style={{ fontSize: "13px", color: "#d0d8ff" }}>
        min: {stats.min} | moy: {stats.avg} | max: {stats.max} | offres: {stats.count}
      </div>
    </div>
  );
}

const card = {
  background: "rgba(20,20,25,0.92)",
  padding: "15px",
  borderRadius: "12px",
  marginBottom: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 8px 22px rgba(0,0,0,0.28)"
};

const marketPanel = {
  background: "rgba(20,20,25,0.92)",
  padding: "15px",
  borderRadius: "12px",
  maxHeight: "94vh",
  overflowY: "auto",
  border: "1px solid rgba(255,255,255,0.08)"
};

const rightPanel = {
  background: "rgba(20,20,25,0.92)",
  padding: "15px",
  borderRadius: "12px",
  maxHeight: "94vh",
  overflowY: "auto",
  border: "1px solid rgba(255,255,255,0.08)"
};

const logCard = {
  background: "rgba(10,10,14,0.95)",
  padding: "10px",
  borderRadius: "10px",
  marginBottom: "8px",
  border: "1px solid rgba(255,255,255,0.05)"
};

const historyCard = {
  background: "rgba(10,10,14,0.95)",
  padding: "10px",
  borderRadius: "10px",
  borderLeft: "4px solid #2f6fed",
  border: "1px solid rgba(255,255,255,0.05)"
};

const historyTopRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "6px"
};

const historyTime = {
  fontSize: "12px",
  color: "#9aa6c7"
};

const moveGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px"
};

const moveButton = {
  display: "block",
  width: "100%",
  padding: "10px",
  background: "linear-gradient(135deg, #2f6fed 0%, #4a8fff 100%)",
  border: "none",
  borderRadius: "8px",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 6px 18px rgba(47,111,237,0.25)"
};

const inputStyle = {
  width: "100%",
  marginBottom: "8px",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #333",
  background: "#0f0f0f",
  color: "white",
  boxSizing: "border-box"
};

const actionButton = {
  width: "100%",
  padding: "10px",
  background: "linear-gradient(135deg, #2f6fed 0%, #4a8fff 100%)",
  border: "none",
  borderRadius: "8px",
  color: "white",
  fontWeight: 700,
  cursor: "pointer"
};

function MapGrid({ knownCells, boatX, boatY, targetCell }) {
  const size = 81;
  const cellSize = 15;

  const cellMap = new Map();
  knownCells.forEach((c) => cellMap.set(`${c.x},${c.y}`, c));

  const cells = [];

  for (let y = size; y >= -size; y--) {
    for (let x = -size; x <= size; x++) {
      const cell = cellMap.get(`${x},${y}`);

      let bg = "#222";

      const islandName = cell?.island_name || cell?.islandName || "";
      const isTradingIsland =
        islandName.toLowerCase().includes("market") ||
        islandName.toLowerCase().includes("commerce") ||
        islandName.toLowerCase().includes("trade");

      if (cell?.type === "SEA") bg = "#3ea6ff";
      if (cell?.type === "SAND") bg = "#d9c36a";
      if (cell?.type === "ROCKS") bg = "#888";
      if (isTradingIsland) bg = "#9b59b6";

      const isBoat = x === boatX && y === boatY;
      const isTarget = targetCell && x === targetCell.x && y === targetCell.y;

      cells.push(
        <div
          key={`${x}-${y}`}
          title={
            isTradingIsland
              ? `Île commerçante (${x}, ${y})`
              : isTarget
                ? `Cible stratégique (${x}, ${y})`
                : `(${x}, ${y})${cell?.type ? ` - ${cell.type}` : ""}`
          }
          style={{
            width: cellSize,
            height: cellSize,
            background: isBoat ? "#ff4d4f" : isTarget ? "#7cfc00" : bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "3px",
            transition: "all 0.2s ease",
            transform: isBoat ? "scale(1.15)" : isTarget ? "scale(1.08)" : "scale(1)",
            boxShadow: isBoat
              ? "0 0 12px rgba(255,77,79,0.7)"
              : isTradingIsland
                ? "0 0 8px rgba(155,89,182,0.8)"
                : isTarget
                  ? "0 0 10px rgba(124,252,0,0.8)"
                  : "none",
            border: isTradingIsland || isTarget ? "2px solid #ffffff" : "none"
          }}
        >
          {isBoat ? "⛵" : isTradingIsland ? "🏪" : isTarget ? "🎯" : ""}
        </div>
      );
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${size * 2 + 1}, ${cellSize}px)`,
        gap: "2px",
        justifyContent: "start"
      }}
    >
      {cells}
    </div>
  );
}

export default App;