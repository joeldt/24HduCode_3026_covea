export default function StatsPanel({ state }) {
  return (
    <>
      <div className="card">
        <h2>Bateau</h2>
        <p>Position : ({state.boat?.x}, {state.boat?.y})</p>
        <p>Énergie : {state.boat?.energy}</p>
        <p>Cases connues : {state.cells?.length}</p>
      </div>

      <div className="card">
        <h2>Joueur</h2>
        <p>Nom : {state.player?.name || "-"}</p>
        <p>Argent : {state.player?.money ?? "-"}</p>
        <p>Quotient : {state.player?.quotient ?? "-"}</p>
        <p>Île de départ : {state.player?.home?.name || "-"}</p>
      </div>
    </>
  );
}