import { useEffect, useMemo, useState } from "react";
import { bootstrapGame, moveBoat, upgradeStorage } from "../services/gameApi.js";

function App() {
  const [player, setPlayer] = useState(null);
  const [runtimeState, setRuntimeState] = useState(null);
  const [error, setError] = useState("");
  const [loadingMove, setLoadingMove] = useState(false);

  async function loadInitialData() {
    try {
      setError("");
      const result = await bootstrapGame();
      setPlayer(result.data.player);
      setRuntimeState(result.data.state);
    } catch (err) {
      console.error("Erreur bootstrap :", err);
      setError(err.message);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  async function handleMove(direction) {
    if (loadingMove) return;

    setLoadingMove(true);

    try {
      setError("");
      const result = await moveBoat(direction);

      setRuntimeState((prev) => ({
        ...prev,
        ...result.data
      }));
    } catch (err) {
      console.error("Erreur move :", err);
      setError(err.message);
    } finally {
      setTimeout(() => {
        setLoadingMove(false);
      }, 5000);
    }
  }

  async function handleUpgradeStorage() {
    try {
      setError("");
      await upgradeStorage();
      await loadInitialData();
    } catch (err) {
      console.error("Erreur upgrade :", err);
      setError(err.message);
    }
  }

  const displayState = useMemo(() => {
    const playerData = player || {};
    const stateData = runtimeState || {};

    const boatX = stateData.position?.x ?? 0;
    const boatY = stateData.position?.y ?? 0;

    const knownCells = stateData.knownCells ?? [];
    const history = stateData.history ?? [];
    const islandDetectionHistory = stateData.islandDetectionHistory ?? [];

    return {
      boat: {
        x: boatX,
        y: boatY,
        energy: stateData.energy ?? playerData.ship?.availableMove ?? 0
      },
      player: {
        name: playerData.name || "-",
        money: playerData.money ?? "-",
        quotient: playerData.quotient ?? "-",
        home: playerData.home?.name || "-"
      },
      knownCells,
      history,
      discoveredCount: knownCells.length,
      islandHistoryFormatted: islandDetectionHistory.map((island, index) => ({
        id: index,
        name: island.name || "Île inconnue",
        coords: Array.isArray(island.tiles)
          ? island.tiles
          : Array.isArray(island.coords)
          ? island.coords
          : [],
        time: island.timestamp
          ? new Date(island.timestamp).toLocaleTimeString()
          : "-"
      }))
    };
  }, [player, runtimeState]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "white",
        padding: "20px",
        display: "grid",
        gridTemplateColumns: "280px 1fr 320px",
        gap: "20px",
        fontFamily: "Arial"
      }}
    >
      <aside>
        <h1>3026 - Cartographie</h1>

        {error && (
          <div style={{ background: "#4a1111", padding: "10px", marginBottom: "10px" }}>
            {error}
          </div>
        )}

        <section style={card}>
          <h2>Bateau</h2>
          <p>Position: ({displayState.boat.x}, {displayState.boat.y})</p>
          <p>Énergie: {displayState.boat.energy}</p>
          <p>Cases connues: {displayState.discoveredCount}</p>
        </section>

        <section style={card}>
          <h2>Joueur</h2>
          <p>{displayState.player.name}</p>
          <p>💰 {displayState.player.money}</p>
          <p>⚖️ {displayState.player.quotient}</p>
          <p>🏝 {displayState.player.home}</p>
        </section>

        <section style={card}>
          <h2>Déplacements</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
            {["N", "S", "E", "W"].map((dir) => (
              <button
                key={dir}
                onClick={() => handleMove(dir)}
                disabled={loadingMove}
                style={{
                  padding: "10px",
                  background: loadingMove ? "#555" : "#2f6fed",
                  border: "none",
                  borderRadius: "8px",
                  color: "white"
                }}
              >
                {dir}
              </button>
            ))}
          </div>

          {loadingMove && <p>Cooldown 5s...</p>}

          <button onClick={handleUpgradeStorage} style={{ marginTop: "10px", width: "100%" }}>
            Upgrade stockage
          </button>
        </section>
      </aside>

      <main>
        <MapGrid
          knownCells={displayState.knownCells}
          boatX={displayState.boat.x}
          boatY={displayState.boat.y}
        />
      </main>

      <aside style={rightPanel}>
        <h2>Historique déplacements</h2>

        {displayState.history.length === 0 ? (
          <p>Aucun déplacement.</p>
        ) : (
          displayState.history
            .slice()
            .reverse()
            .map((move, i) => (
              <div key={i} style={logCard}>
                <strong>{move.direction}</strong>
                <div>📍 ({move.position?.x},{move.position?.y})</div>
                <div>⚡ {move.energy}</div>
                <div>🕒 {move.timestamp ? new Date(move.timestamp).toLocaleTimeString() : "-"}</div>
              </div>
            ))
        )}

        <h2 style={{ marginTop: "20px" }}>Îles détectées</h2>

        {displayState.islandHistoryFormatted.length === 0 ? (
          <p>Aucune île détectée.</p>
        ) : (
          displayState.islandHistoryFormatted.map((island) => (
            <div key={island.id} style={logCard}>
              🏝 {island.name}
              <div>{island.time}</div>
              {Array.isArray(island.coords) &&
                island.coords.map((c, i) => (
                  <div key={i} style={{ fontSize: "12px", color: "#aaa" }}>
                    ({c.x}, {c.y})
                  </div>
                ))}
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

function MapGrid({ knownCells, boatX, boatY }) {
  const size = 25;
  const cellSize = 28;

  const cellMap = new Map();
  knownCells.forEach((c) => cellMap.set(`${c.x},${c.y}`, c));

  const cells = [];

  for (let y = size; y >= -size; y--) {
    for (let x = -size; x <= size; x++) {
      const cell = cellMap.get(`${x},${y}`);

      let bg = "#2a2a2a";
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
          {isBoat && "⛵"}
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