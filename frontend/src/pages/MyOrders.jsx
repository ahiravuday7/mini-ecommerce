import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getMyOrders } from "../api/orders.api";
import { useAuth } from "../context/AuthContext";

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
  if (booting) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body d-flex align-items-center gap-2 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" />
          <span>Checking session...</span>
        </div>
      </div>
    );
  }

  if (!user) return null; // renders nothing for unauthenticated users as they are immediately redirected to the login page.

  return (
    <div className="py-2">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h2 className="mb-1">My Orders</h2>
          <p className="text-secondary mb-0">Track your placed orders.</p>
        </div>

        <Link to="/" className="btn btn-outline-primary btn-sm">
          &larr; Continue shopping
        </Link>
      </div>

      {/* Success message if user just placed an order */}
      {justPlacedOrderId && (
        <div className="alert alert-success" role="alert">
          Order placed successfully (Order ID: <b>{justPlacedOrderId}</b>)
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body d-flex align-items-center gap-2 text-secondary">
            <div className="spinner-border spinner-border-sm" role="status" />
            <span>Loading orders...</span>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h5 className="mb-2">No orders yet</h5>
            <p className="text-secondary mb-3">
              Place your first order to see it here.
            </p>
            <Link to="/" className="btn btn-outline-primary">
              Shop products
            </Link>
          </div>
        </div>
      ) : (
        <div className="d-grid gap-3">
          {orders.map((o) => (
            <div key={o._id} className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex flex-wrap justify-content-between gap-3">
                  <div>
                    <div className="fw-bold">
                      Order ID: <span className="fw-semibold">{o._id}</span>
                    </div>
                    <div className="text-secondary small mt-1">
                      Placed on: {new Date(o.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="text-lg-end">
                    <div className="fw-bold">{`\u20B9${o.totalPrice}`}</div>
                    <div className="small text-secondary">
                      Status: <b>{o.status}</b>
                    </div>
                  </div>
                </div>

                <hr />

                <div className="d-grid gap-2">
                  {/* If o.items exists → use it, If not → use empty array [], show only first 3 items */}
                  {(o.items || []).slice(0, 3).map((it, idx) => (
                    <div key={idx} className="d-flex gap-2 align-items-center">
                      <img
                        src={
                          it.image || "https://via.placeholder.com/100?text=Img"
                        }
                        alt={it.title || "item"}
                        className="rounded-3 summary-item-image"
                      />
                      <div className="flex-grow-1">
                        <div className="fw-semibold small">{it.title}</div>
                        <div className="small text-secondary">
                          Qty: {it.qty} - {`\u20B9${it.price}`}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* If there are more than 3 items, show a message */}
                  {(o.items || []).length > 3 && (
                    <div className="small text-secondary">
                      +{(o.items || []).length - 3} more item(s)
                    </div>
                  )}
                </div>

                {/* Order details page later */}
                <div className="d-flex justify-content-end mt-3">
                  <button
                    disabled={!o._id}
                    onClick={() => navigate(`/orders/${o._id}`)}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
