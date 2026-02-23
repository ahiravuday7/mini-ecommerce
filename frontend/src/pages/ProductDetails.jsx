import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchProductById } from "../api/products.api";
import { addToCart } from "../api/cart.api";

const cardStyle = {
  border: "1px solid #eee",
  borderRadius: 14,
  overflow: "hidden",
  background: "white",
};

const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 10,
  outline: "none",
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [adding, setAdding] = useState(false);

  // quantity options based on available stock
  const qtyOptions = useMemo(() => {
    const stock = p?.stock ?? 0; // determines the available stock
    return Array.from({ length: Math.max(stock, 0) }, (_, i) => i + 1);
  }, [p]);

  // fetch product by ID
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await fetchProductById(id);
      setP(data);
      setQty(1);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  // automatically runs load function to fetch the product data as soon as the page opens or whenever the product ID changes.
  useEffect(() => {
    load();
  }, [id]);

  // add to cart
  const onAddToCart = async () => {
    try {
      setAdding(true);
      setActionMsg("");
      setActionErr("");

      await addToCart({ productId: id, qty }); // Sends the API request to add the specific product (id) and the selected quantity (qty) to the backend, waiting for it to finish.

      setActionMsg("Added to cart ✅"); // success message
      // go to cart after a moment
      setTimeout(() => navigate("/cart"), 600);
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to add to cart";

      if (
        msg.toLowerCase().includes("no token") ||
        e?.response?.status === 401
      ) {
        setActionErr("Please login first to add items to cart.");
        return;
      }

      setActionErr(msg);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div>Loading product...</div>;
  if (error) return <div style={{ color: "crimson" }}>{error}</div>;
  if (!p) return <div>Product not found</div>;

  return (
    <div>
      {/* Back to products page */}
      <div style={{ marginBottom: 12 }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          ← Back to products
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Image */}
        <div style={cardStyle}>
          <div style={{ height: 420, background: "#fafafa" }}>
            <img
              src={
                p.image || "https://via.placeholder.com/600x400?text=No+Image"
              }
              alt={p.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>

        {/* Details */}
        <div style={cardStyle}>
          <div style={{ padding: 16 }}>
            <h2 style={{ margin: "0 0 8px" }}>{p.title}</h2>

            {/* eg. Nike • Shoes */}
            <div style={{ color: "#666", marginBottom: 10 }}>
              {p.brand ? `${p.brand} • ` : ""}
              {p.category || "General"}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 22 }}>₹{p.price}</div>
              {p.mrp > p.price && (
                <div style={{ textDecoration: "line-through", color: "#999" }}>
                  ₹{p.mrp}
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: 10,
                color: p.stock > 0 ? "#2e7d32" : "#c62828",
              }}
            >
              {p.stock > 0 ? `In stock (${p.stock})` : "Out of stock"}
            </div>

            <div style={{ marginTop: 14, color: "#444", lineHeight: 1.5 }}>
              {p.description || "No description provided."}
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #eee",
                margin: "16px 0",
              }}
            />

            {/* Qty + Add */}
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <label style={{ minWidth: 70, color: "#555" }}>Qty</label>
                <select
                  style={{ ...inputStyle, width: 120 }}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  disabled={p.stock <= 0}
                >
                  {qtyOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={onAddToCart}
                disabled={p.stock <= 0 || adding}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "none",
                  cursor: p.stock <= 0 || adding ? "not-allowed" : "pointer",
                  fontWeight: 800,
                }}
              >
                {adding ? "Adding..." : "Add to Cart"}
              </button>

              {actionMsg && (
                <div
                  style={{
                    background: "#f1fff3",
                    border: "1px solid #bff0c4",
                    padding: 10,
                    borderRadius: 10,
                    color: "#1b5e20",
                  }}
                >
                  {actionMsg}
                </div>
              )}
              {actionErr && (
                <div
                  style={{
                    background: "#fff3f3",
                    border: "1px solid #ffd0d0",
                    padding: 10,
                    borderRadius: 10,
                    color: "#a40000",
                  }}
                >
                  {actionErr}
                </div>
              )}

              {/* if not logged in */}
              {actionErr.toLowerCase().includes("login") && (
                <button
                  onClick={() => navigate("/login")}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    fontWeight: 700,
                    background: "white",
                  }}
                >
                  Go to Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive small screen */}
      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns: 1.1fr 0.9fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
