const directions = ["N", "S", "E", "W", "NE", "NW", "SE", "SW"];

export default function Controls({ onMove, loading }) {
  return (
    <div className="card">
      <h2>Déplacements</h2>
      <div className="controls">
        {directions.map((dir) => (
          <button
            key={dir}
            onClick={() => onMove(dir)}
            disabled={loading}
          >
            {dir}
          </button>
        ))}
      </div>
    </div>
  );
}