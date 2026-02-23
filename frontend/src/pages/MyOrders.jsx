import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getMyOrders } from "../api/orders.api";
import { useAuth } from "../context/AuthContext";

const card = {
  border: "1px solid #eee",
  borderRadius: 14,
  background: "white",
  padding: 14,
};

export default function MyOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, booting } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // If user just placed an order, we'll get the order ID from the location state (from checkout)
  const justPlacedOrderId = location.state?.justPlacedOrderId || "";

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getMyOrders();
      setOrders(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to login if not logged in
  useEffect(() => {
    if (!booting && !user) navigate("/login");
  }, [booting, user, navigate]);

  // Load orders if logged in
  useEffect(() => {
    if (!booting && user) load();
  }, [booting, user]);

  // displays a loading message while the app verifies the session
  if (booting) return <div>Checking session...</div>;
  if (!user) return null; // renders nothing for unauthenticated users as they are immediately redirected to the login page.

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
          <h2 style={{ margin: "6px 0 2px" }}>My Orders</h2>
          <div style={{ color: "#666", fontSize: 14 }}>
            Track your placed orders.
          </div>
        </div>

        <Link to="/" style={{ textDecoration: "none" }}>
          ← Continue shopping
        </Link>
      </div>

      {/* success banner after checkout */}
      {justPlacedOrderId && (
        <div
          style={{
            marginTop: 12,
            background: "#f1fff3",
            border: "1px solid #bff0c4",
            padding: 12,
            borderRadius: 12,
            color: "#1b5e20",
          }}
        >
          Order placed successfully ✅ (Order ID: <b>{justPlacedOrderId}</b>)
        </div>
      )}

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
        <div style={{ marginTop: 12 }}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={{ marginTop: 14 }}>
          You have no orders yet. <Link to="/">Shop products</Link>
        </div>
      ) : (
        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          {orders.map((o) => (
            <div key={o._id} style={card}>
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
                    Order ID: <span style={{ fontWeight: 700 }}>{o._id}</span>
                  </div>
                  <div style={{ color: "#666", fontSize: 13, marginTop: 4 }}>
                    Placed on: {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900 }}>₹{o.totalPrice}</div>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    Status: <b>{o.status}</b>
                  </div>
                </div>
              </div>

              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid #eee",
                  margin: "12px 0",
                }}
              />

              <div style={{ display: "grid", gap: 10 }}>
                {/* If o.items exists → use it, If not → use empty array [], show only first 3 items */}
                {(o.items || []).slice(0, 3).map((it, idx) => (
                  <div
                    key={idx}
                    style={{ display: "flex", gap: 10, alignItems: "center" }}
                  >
                    <img
                      src={
                        it.image || "https://via.placeholder.com/100?text=Img"
                      }
                      alt={it.title || "item"}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        objectFit: "cover",
                        background: "#fafafa",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>
                        {it.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        Qty: {it.qty} • ₹{it.price}
                      </div>
                    </div>
                  </div>
                ))}

                {/*If items are more than 3, show how many extra items are hidden */}
                {(o.items || []).length > 3 && (
                  <div style={{ fontSize: 13, color: "#666" }}>
                    +{(o.items || []).length - 3} more item(s)
                  </div>
                )}
              </div>

              {/* Order details page later */}
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  disabled={!o._id}
                  onClick={() => navigate(`/orders/${o._id}`)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
