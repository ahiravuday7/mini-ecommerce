import { Link } from "react-router-dom";

export default function ProductCard({ p }) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 12,
        overflow: "hidden",
        background: "white",
      }}
    >
      <Link
        to={`/product/${p._id}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div style={{ height: 180, background: "#fafafa" }}>
          <img
            src={p.image || "https://via.placeholder.com/600x400?text=No+Image"}
            alt={p.title}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            loading="lazy"
          />
        </div>

        <div style={{ padding: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>{p.title}</div>

          <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
            {p.brand ? `${p.brand} • ` : ""}
            {p.category || "General"}
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>₹{p.price}</div>
            {p.mrp > p.price && (
              <div
                style={{
                  textDecoration: "line-through",
                  color: "#999",
                  fontSize: 13,
                }}
              >
                ₹{p.mrp}
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: p.stock > 0 ? "#2e7d32" : "#c62828",
            }}
          >
            {p.stock > 0 ? `In stock (${p.stock})` : "Out of stock"}
          </div>
        </div>
      </Link>
    </div>
  );
}
