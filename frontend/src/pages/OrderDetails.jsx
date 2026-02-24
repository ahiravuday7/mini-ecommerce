import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getOrderById } from "../api/orders.api";
import { useAuth } from "../context/AuthContext";

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

  if (!user) return null; // Redirecting to login

  return (
    <div className="py-2">
      <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
        <Link to="/orders" className="btn btn-link p-0 text-decoration-none">
          &larr; Back to My Orders
        </Link>

        <Link to="/" className="btn btn-link p-0 text-decoration-none">
          Continue shopping &rarr;
        </Link>
      </div>

      <h2 className="mb-1">Order Details</h2>
      <p className="text-secondary">View complete order information.</p>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body d-flex align-items-center gap-2 text-secondary">
            <div className="spinner-border spinner-border-sm" role="status" />
            <span>Loading order...</span>
          </div>
        </div>
      ) : !order ? (
        <div className="alert alert-secondary mb-0">Order not found.</div>
      ) : (
        <div className="row g-4">
          {/* Order Details lefr side */}
          <div className="col-lg-8">
            <div className="d-grid gap-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-between gap-3">
                    <div>
                      <div className="fw-bold">
                        Order ID:{" "}
                        <span className="fw-semibold">{order._id}</span>
                      </div>
                      <div className="text-secondary small mt-1">
                        Placed on: {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-lg-end">
                      <div className="fw-bold fs-5">{`\u20B9${order.totalPrice}`}</div>
                      <div className="small text-secondary">
                        Status: <b>{order.status}</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="mb-3">Shipping Address</h5>
                  <div className="text-body-secondary lh-base">
                    <div>
                      <b>{order.shippingAddress?.fullName}</b> -{" "}
                      {order.shippingAddress?.phone}
                    </div>
                    <div>{order.shippingAddress?.addressLine1}</div>
                    {order.shippingAddress?.addressLine2 ? (
                      <div>{order.shippingAddress?.addressLine2}</div>
                    ) : null}
                    <div>
                      {order.shippingAddress?.city},{" "}
                      {order.shippingAddress?.state} -{" "}
                      {order.shippingAddress?.pincode}
                    </div>
                    <div>{order.shippingAddress?.country}</div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="mb-3">Items</h5>

                  <div className="d-grid gap-3">
                    {(order.items || []).map((it, idx) => (
                      <div
                        key={idx}
                        className="d-flex gap-3 align-items-center"
                      >
                        <img
                          src={
                            it.image ||
                            "https://via.placeholder.com/100?text=Img"
                          }
                          alt={it.title || "item"}
                          className="rounded-3 order-item-image"
                        />

                        <div className="flex-grow-1">
                          <div className="fw-bold">{it.title}</div>
                          <div className="small text-secondary">
                            Qty: {it.qty} - {`\u20B9${it.price}`}
                          </div>
                        </div>

                        <div className="fw-bold">{`\u20B9${it.price * it.qty}`}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary right side */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm summary-sticky">
              <div className="card-body">
                <h5 className="mb-3">Summary</h5>

                <Row label="Items" value={`\u20B9${totals.itemsPrice}`} />
                <Row label="Shipping" value={`\u20B9${totals.shippingPrice}`} />
                <Row label="Tax" value={`\u20B9${totals.taxPrice}`} />
                <hr />
                <Row
                  label={<b>Total</b>}
                  value={<b>{`\u20B9${totals.totalPrice}`}</b>}
                />

                <hr />

                <h6 className="mb-2">Payment</h6>
                <div className="small text-secondary">
                  Method: <b>{order.paymentMethod || "COD"}</b>
                </div>
                <div className="small text-secondary">
                  Status: <b>{order.paymentStatus || "pending"}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="d-flex justify-content-between py-1">
      <span className="text-secondary">{label}</span>
      <span>{value}</span>
    </div>
  );
}
