import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getOrderById } from "../api/orders.api";
import { useAuth } from "../context/AuthContext";

const card = {
  border: "1px solid #eee",
  borderRadius: 14,
  background: "white",
  padding: 14,
};

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, booting } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totals = useMemo(() => {
    if (!order) return null;
    return {
      itemsPrice: order.itemsPrice ?? 0,
      shippingPrice: order.shippingPrice ?? 0,
      taxPrice: order.taxPrice ?? 0,
      totalPrice: order.totalPrice ?? 0,
    };
  }, [order]);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getOrderById(id);
      setOrder(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load order details");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to login if not logged in
  useEffect(() => {
    if (!booting && !user) navigate("/login");
  }, [booting, user, navigate]);

  // Load order details if logged in
  useEffect(() => {
    if (!booting && user) load();
  }, [booting, user, id]);

  if (booting) return <div>Checking session...</div>;
  if (!user) return null; // Redirecting to login

  return (
    <div>
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <Link to="/orders" style={{ textDecoration: "none" }}>
          ← Back to My Orders
        </Link>

        <Link to="/" style={{ textDecoration: "none" }}>
          Continue shopping →
        </Link>
      </div>

      <h2 style={{ margin: "6px 0 2px" }}>Order Details</h2>
      <div style={{ color: "#666", fontSize: 14 }}>
        View complete order information.
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            background: "#fff3f3",
            border: "1px solid #ffd0d0",
            padding: 12,
            borderRadius: 12,
            color: "#a40000",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: 12 }}>Loading order...</div>
      ) : !order ? (
        <div style={{ marginTop: 14 }}>Order not found.</div>
      ) : (
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 14,
            alignItems: "start",
          }}
        >
          {/* LEFT: Items + Address */}
          <div style={{ display: "grid", gap: 12 }}>
            <div style={card}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>
                    Order ID:{" "}
                    <span style={{ fontWeight: 700 }}>{order._id}</span>
                  </div>
                  <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
                    Placed on: {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>
                    ₹{order.totalPrice}
                  </div>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    Status: <b>{order.status}</b>
                  </div>
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>
                Shipping Address
              </div>
              <div style={{ color: "#333", lineHeight: 1.6 }}>
                <div>
                  <b>{order.shippingAddress?.fullName}</b> •{" "}
                  {order.shippingAddress?.phone}
                </div>
                <div>{order.shippingAddress?.addressLine1}</div>
                {order.shippingAddress?.addressLine2 ? (
                  <div>{order.shippingAddress?.addressLine2}</div>
                ) : null}
                <div>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                  - {order.shippingAddress?.pincode}
                </div>
                <div>{order.shippingAddress?.country}</div>
              </div>
            </div>

            <div style={card}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Items</div>

              <div style={{ display: "grid", gap: 10 }}>
                {(order.items || []).map((it, idx) => (
                  <div
                    key={idx}
                    style={{ display: "flex", gap: 12, alignItems: "center" }}
                  >
                    <img
                      src={
                        it.image || "https://via.placeholder.com/100?text=Img"
                      }
                      alt={it.title || "item"}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        objectFit: "cover",
                        background: "#fafafa",
                      }}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900 }}>{it.title}</div>
                      <div style={{ color: "#666", fontSize: 13 }}>
                        Qty: {it.qty} • ₹{it.price}
                      </div>
                    </div>

                    <div style={{ fontWeight: 900 }}>₹{it.price * it.qty}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Summary */}
          <div style={{ ...card, position: "sticky", top: 84 }}>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>
              Summary
            </div>

            <Row label="Items" value={`₹${totals.itemsPrice}`} />
            <Row label="Shipping" value={`₹${totals.shippingPrice}`} />
            <Row label="Tax" value={`₹${totals.taxPrice}`} />
            <hr
              style={{
                border: "none",
                borderTop: "1px solid #eee",
                margin: "10px 0",
              }}
            />
            <Row label={<b>Total</b>} value={<b>₹{totals.totalPrice}</b>} />

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #eee",
                margin: "12px 0",
              }}
            />

            <div style={{ fontWeight: 900, marginBottom: 6 }}>Payment</div>
            <div style={{ color: "#666", fontSize: 13 }}>
              Method: <b>{order.paymentMethod || "COD"}</b>
            </div>
            <div style={{ color: "#666", fontSize: 13 }}>
              Status: <b>{order.paymentStatus || "pending"}</b>
            </div>
          </div>

          <style>{`
            @media (max-width: 900px) {
              div[style*="grid-template-columns: 1.2fr 0.8fr"] {
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
