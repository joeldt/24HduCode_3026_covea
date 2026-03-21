export default function HistoryPanel({ history = [] }) {
  return (
    <div className="card">
      <h2>Historique</h2>
      <div className="history">
        {history.length ? (
          history
            .slice()
            .reverse()
            .map((item, idx) => (
              <div key={idx} className="history-item">
                <strong>{item.direction}</strong> → ({item.position?.x},{item.position?.y}) | énergie {item.energy}
              </div>
            ))
        ) : (
          <p>Aucun movement</p>
        )}
      </div>
    </div>
  );
}