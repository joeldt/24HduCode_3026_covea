import { useEffect, useState } from "react";
import { fetchPlayer, fetchState, moveBoat, upgradeStorage } from "../services/gameApi.js";
function App() {
  const [player, setPlayer] = useState(null);
  const [state, setState] = useState(null);
  const [error, setError] = useState("");

  async function loadInitialData() {
    try {
      setError("");

      const playerRes = await fetchPlayer();
      const stateRes = await fetchState();

      setPlayer(playerRes.data);
      setState(stateRes.data);
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
      setError("");
      const result = await moveBoat(direction);
      setState(result.data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpgradeStorage() {
    try {
      setError("");
      const result = await upgradeStorage();
      console.log("Upgrade storage:", result);
      await loadInitialData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>3026 Dashboard</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Joueur</h2>
      <pre>{JSON.stringify(player, null, 2)}</pre>

      <h2>État</h2>
      <pre>{JSON.stringify(state, null, 2)}</pre>

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button onClick={() => handleMove("N")}>N</button>
        <button onClick={() => handleMove("S")}>S</button>
        <button onClick={() => handleMove("E")}>E</button>
        <button onClick={() => handleMove("W")}>W</button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button onClick={handleUpgradeStorage}>
          Améliorer l'entrepôt
        </button>
      </div>
    </div>
  );
}

export default App;