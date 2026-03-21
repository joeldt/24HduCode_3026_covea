function getCellColor(type, isBoat) {
  if (isBoat) return "#ff4d4f";
  if (type === "SEA") return "#4da6ff";
  if (type === "SAND") return "#f2d16b";
  if (type === "ROCKS") return "#8c8c8c";
  return "#1f1f1f";
}

export default function MapGrid({ boat, cells }) {
  const radius = 8;

  const byKey = Object.fromEntries(
    cells.map((cell) => [`${cell.x},${cell.y}`, cell])
  );

  const rows = [];

  for (let y = boat.y + radius; y >= boat.y - radius; y--) {
    const cols = [];

    for (let x = boat.x - radius; x <= boat.x + radius; x++) {
      const key = `${x},${y}`;
      const cell = byKey[key];
      const isBoat = x === boat.x && y === boat.y;

      cols.push(
        <div
          key={key}
          className="cell"
          title={`(${x},${y}) - ${cell?.type || "UNKNOWN"}`}
          style={{ background: getCellColor(cell?.type, isBoat) }}
        >
          {isBoat ? "⛵" : ""}
        </div>
      );
    }

    rows.push(
      <div className="row" key={`row-${y}`}>
        {cols}
      </div>
    );
  }

  return <div className="grid">{rows}</div>;
}