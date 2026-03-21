import { useEffect, useMemo, useState } from "react";
import { fetchPlayer, fetchState, moveBoat, upgradeStorage } from "../services/gameApi.js";

function App() {
  const [player, setPlayer] = useState(null);
  const [runtimeState, setRuntimeState] = useState(null);
  const [error, setError] = useState("");
  const [loadingMove, setLoadingMove] = useState(false);

  async function loadInitialData() {
    try {
      setError("");

      const [playerRes, stateRes] = await Promise.all([
        fetchPlayer(),
        fetchState()
      ]);

      setPlayer(playerRes.data);
      setRuntimeState(stateRes.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    const init = async () => {
      await loadInitialData();
    };

    init();
  }, []);

  async function handleMove(direction) {
    try {
      setLoadingMove(true);
      setError("");

      const result = await moveBoat(direction);
      setRuntimeState(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMove(false);
    }
  }

  async function handleUpgradeStorage() {
    try {
      setError("");
      await upgradeStorage();
      await loadInitialData();
    } catch (err) {
      setError(err.message);
    }
  }

  const displayState = useMemo(() => {
    const playerData = player || {};
    const stateData = runtimeState || {};

    const boatX = stateData.position?.x ?? 0;
    const boatY = stateData.position?.y ?? 0;
    const energy = stateData.energy ?? playerData.ship?.availableMove ?? 0;
    const knownCells = stateData.knownCells ?? [];
    const history = stateData.history ?? [];

    return {
      boat: {
        x: boatX,
        y: boatY,
        energy
      },
      player: {
        name: playerData.name || "-",
        money: playerData.money ?? "-",
        quotient: playerData.quotient ?? "-",
        home: playerData.home?.name || "-"
      },
      knownCells,
      history,
      discoveredCount: knownCells.length
    };
  }, [player, runtimeState]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0b0b0b",
        color: "white",
        padding: "20px",
        display: "flex",
        gap: "20px",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <aside style={{ width: "280px" }}>
        <h1 style={{ marginBottom: "20px" }}>3026 - Cartographie</h1>

        {error && (
          <div
            style={{
              background: "#3a1111",
              color: "#ff6b6b",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "15px"
            }}
          >
            {error}
          </div>
        )}

        <section
          style={{
            background: "#1b1b1b",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "15px"
          }}
        >
          <h2>Bateau</h2>
          <p>Position: ({displayState.boat.x}, {displayState.boat.y})</p>
          <p>Énergie: {displayState.boat.energy}</p>
          <p>Cases connues : {displayState.discoveredCount}</p>
        </section>

        <section
          style={{
            background: "#1b1b1b",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "15px"
          }}
        >
          <h2>Joueur</h2>
          <p>Nom : {displayState.player.name}</p>
          <p>Argent : {displayState.player.money}</p>
          <p>Quotient : {displayState.player.quotient}</p>
          <p>Île de départ : {displayState.player.home}</p>
        </section>

        <section
          style={{
            background: "#1b1b1b",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "15px"
          }}
        >
          <h2>Déplacements</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {["N", "S", "E", "W", "NE", "NW", "SE", "SW"].map((dir) => (
              <button
                key={dir}
                onClick={() => handleMove(dir)}
                disabled={loadingMove}
                style={{
                  padding: "10px",
                  background: "#2f6fed",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                {dir}
              </button>
            ))}
          </div>

          <button
            onClick={handleUpgradeStorage}
            style={{
              marginTop: "15px",
              width: "100%",
              padding: "12px",
              background: "#2f6fed",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer"
            }}
          >
            Améliorer l'entrepôt
          </button>
        </section>
      </aside>

      <main style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "12px" }}>
          <Legend color="#3ea6ff" label="Mer" />
          <Legend color="#d9c36a" label="Sable" />
          <Legend color="#8e8e8e" label="Rochers" />
          <Legend color="#ff4d4f" label="Bateau" />
          <Legend color="#2a2a2a" label="Inconnu" />
        </div>

        <MapGrid
          knownCells={displayState.knownCells}
          boatX={displayState.boat.x}
          boatY={displayState.boat.y}
        />
      </main>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div
        style={{
          width: "14px",
          height: "14px",
          background: color,
          borderRadius: "3px"
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function MapGrid({ knownCells, boatX, boatY }) {
  const size = 17;
  const cellSize = 30;

  const cellMap = new Map();
  for (const cell of knownCells) {
    cellMap.set(`${cell.x},${cell.y}`, cell);
  }

  const cells = [];
  for (let y = 8; y >= -8; y--) {
    for (let x = -8; x <= 8; x++) {
      const key = `${x + boatX},${y + boatY}`;
      const cell = cellMap.get(key);

      let bg = "#2a2a2a";
      if (cell?.type === "SEA") bg = "#3ea6ff";
      if (cell?.type === "SAND") bg = "#d9c36a";
      if (cell?.type === "ROCKS") bg = "#8e8e8e";

      const isBoat = x === 0 && y === 0;

      cells.push(
        <div
          key={`${x}-${y}`}
          style={{
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            background: isBoat ? "#ff4d4f" : bg,
            border: "1px solid #111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            fontSize: "14px"
          }}
          title={cell ? `${cell.type} (${cell.x}, ${cell.y})` : "Inconnu"}
        >
          {isBoat ? "⛵" : ""}
        </div>
      );
    }
  }

  return (
    <div
      style={{
        background: "#111",
        padding: "12px",
        borderRadius: "12px",
        display: "inline-grid",
        gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
        gap: "2px"
      }}
    >
      {cells}
    </div>
  );
}

export default App;