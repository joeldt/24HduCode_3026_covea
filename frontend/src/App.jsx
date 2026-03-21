import { useEffect, useState } from "react";
import { getState, moveBoat } from "./services/gameApi";
import MapGrid from "./components/MapGrid";
import Controls from "./components/Controls";
import StatsPanel from "./components/StatsPanel";
import HistoryPanel from "./components/HistoryPanel";

export default function App() {
  const [state, setState] = useState({
    boat: { x: 0, y: 0, energy: 0 },
    cells: [],
    player: null,
    history: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadState() {
    try {
      setLoading(true);
      setError("");
      const newState = await getState();
      setState(newState);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMove(direction) {
    try {
      setLoading(true);
      setError("");
      const newState = await moveBoat(direction);
      setState(newState);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadState();
  }, []);

  return (
    <div className="page">
      <aside className="sidebar">
        <h1>3026 - Cartographie</h1>

        <StatsPanel state={state} />
        <Controls onMove={handleMove} loading={loading} />
        <HistoryPanel history={state.history} />

        {loading && <p>Chargement...</p>}
        {error && <p className="error">{error}</p>}
      </aside>

      <main className="map-wrapper">
        <div className="legend">
          <span><i className="legend-box sea" /> Mer</span>
          <span><i className="legend-box sand" /> Sable</span>
          <span><i className="legend-box rocks" /> Rochers</span>
          <span><i className="legend-box boat" /> Bateau</span>
          <span><i className="legend-box unknown" /> Inconnu</span>
        </div>

        <MapGrid boat={state.boat} cells={state.cells} />
      </main>
    </div>
  );
}