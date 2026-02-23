import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  clearCart,
  getCart,
  removeFromCart,
  updateCartItem,
} from "../api/cart.api";
import { useAuth } from "../context/AuthContext";

const card = {
  border: "1px solid #eee",
  borderRadius: 14,
  background: "white",
};

const btn = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
  fontWeight: 700,
};

export default function Cart() {
  const navigate = useNavigate();
  const { user, booting } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(""); // productId currently updating
  const [error, setError] = useState("");

  // fetch cart from backend
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getCart();
      setCart(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load cart");
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  // If call getCart() before auth finishes, request might fail (401) because token not ready.
  //So they wait: once booting becomes false, then load cart.
  useEffect(() => {
    if (!booting) load();
  }, [booting]);

  // If cart is null (not loaded / error), items becomes an empty array
  const items = cart?.items || [];

  // Calculate totals
  const totals = useMemo(() => {
    const itemsPrice = items.reduce(
      (sum, it) => sum + (it.priceAtAdd || it.product?.price || 0) * it.qty,
      0,
    );
    const shipping = itemsPrice >= 999 ? 0 : itemsPrice > 0 ? 50 : 0;
    const tax = 0;
    const total = itemsPrice + shipping + tax;
    return {
      itemsPrice,
      shipping,
      tax,
      total,
    };
  }, [items]);

  // Update qty of an item in cart
  const onUpdateQty = async (productId, qty) => {
    try {
      setBusyId(productId);
      await updateCartItem({ productId, qty });
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update qty");
    } finally {
      setBusyId("");
    }
  };

  // Remove an item from cart
  const onRemove = async (productId) => {
    try {
      setBusyId(productId);
      await removeFromCart(productId);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to remove item");
    } finally {
      setBusyId("");
    }
  };

  // Clear cart
  const onClear = async () => {
    try {
      setBusyId("CLEAR");
      await clearCart();
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to clear cart");
    } finally {
      setBusyId("");
    }
  };

  // Not logged-in state
  if (!booting && !user) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h2>Your Cart</h2>
        <div
          style={{
            background: "#fff8e1",
            border: "1px solid #ffe0a3",
            padding: 12,
            borderRadius: 12,
            marginTop: 10,
          }}
        >
          You need to login to view your cart.
        </div>

        <button
          onClick={() => navigate("/login")}
          style={{ ...btn, marginTop: 12, border: "none" }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div>
          <h2 style={{ margin: "6px 0 2px" }}>Your Cart</h2>
          <div style={{ color: "#666", fontSize: 14 }}>
            Manage items, update quantity, and checkout.
          </div>
        </div>

        <button
          onClick={onClear}
          disabled={items.length === 0 || busyId === "CLEAR"}
          style={{
            ...btn,
            borderColor: "#f2c9c9",
            color: "#a40000",
            background: items.length === 0 ? "#fafafa" : "white",
            cursor: items.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          {busyId === "CLEAR" ? "Clearing..." : "Clear Cart"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fff3f3",
            border: "1px solid #ffd0d0",
            padding: 12,
            borderRadius: 12,
            color: "#a40000",
            marginTop: 12,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: 12 }}>Loading cart...</div>
      ) : items.length === 0 ? (
        <div style={{ marginTop: 14 }}>
          Your cart is empty. <Link to="/">Continue shopping</Link>
        </div>
      ) : (
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "1.3fr 0.7fr",
            gap: 14,
            alignItems: "start",
          }}
        >
          {/* LEFT: Items */}
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((it) => {
              const p = it.product;
              const price = it.priceAtAdd || p?.price || 0;
              const maxStock = p?.stock ?? it.qty;

              return (
                <div
                  key={p?._id || Math.random()}
                  style={{ ...card, padding: 12 }}
                >
                  <div style={{ display: "flex", gap: 12 }}>
                    <img
                      src={
                        p?.image ||
                        "https://via.placeholder.com/600x400?text=No+Image"
                      }
                      alt={p?.title || "Product"}
                      style={{
                        width: 90,
                        height: 90,
                        borderRadius: 12,
                        objectFit: "cover",
                        background: "#fafafa",
                      }}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, marginBottom: 4 }}>
                        <Link
                          to={`/product/${p?._id}`}
                          style={{ textDecoration: "none" }}
                        >
                          {p?.title || "Unknown Product"}
                        </Link>
                      </div>

                      <div
                        style={{
                          color: "#666",
                          fontSize: 13,
                          marginBottom: 10,
                        }}
                      >
                        {p?.brand ? `${p.brand} • ` : ""}
                        {p?.category || "General"}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <div style={{ fontWeight: 900 }}>₹{price}</div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <select
                            value={it.qty}
                            disabled={busyId === p?._id}
                            onChange={(e) =>
                              onUpdateQty(p._id, Number(e.target.value))
                            }
                            style={{
                              padding: "8px 10px",
                              borderRadius: 10,
                              border: "1px solid #ddd",
                            }}
                          >
                            {Array.from(
                              { length: Math.max(maxStock, 1) },
                              (_, i) => i + 1,
                            ).map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => onRemove(p._id)}
                            disabled={busyId === p?._id}
                            style={{
                              ...btn,
                              borderColor: "#f2c9c9",
                              color: "#a40000",
                            }}
                          >
                            {busyId === p?._id ? "..." : "Remove"}
                          </button>
                        </div>
                      </div>

                      <div
                        style={{ marginTop: 10, fontSize: 13, color: "#444" }}
                      >
                        Subtotal: <b>₹{price * it.qty}</b>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: Summary */}
          <div style={{ ...card, padding: 14, position: "sticky", top: 84 }}>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>
              Order Summary
            </div>

            <Row label="Items" value={`₹${totals.itemsPrice}`} />
            <Row label="Shipping" value={`₹${totals.shipping}`} />
            <Row label="Tax" value={`₹${totals.tax}`} />
            <hr
              style={{
                border: "none",
                borderTop: "1px solid #eee",
                margin: "10px 0",
              }}
            />
            <Row label={<b>Total</b>} value={<b>₹{totals.total}</b>} />

            <button
              onClick={() => navigate("/checkout")}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              Proceed to Checkout
            </button>

            <div style={{ marginTop: 10, fontSize: 13, color: "#666" }}>
              Free shipping on orders ₹999+
            </div>
          </div>

          <style>{`
            @media (max-width: 900px) {
              div[style*="grid-template-columns: 1.3fr 0.7fr"] {
                grid-template-columns: 1fr !important;
              }
              div[style*="position: sticky"] {
                position: relative !important;
                top: auto !important;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
      }}
    >
      <div style={{ color: "#666" }}>{label}</div>
      <div>{value}</div>
    </div>
  );
}
