import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  clearCart,
  getCart,
  removeFromCart,
  updateCartItem,
} from "../api/cart.api";
import { useAuth } from "../context/AuthContext";

export default function Cart() {
  const navigate = useNavigate();
  const { user, booting } = useAuth();
  // dummy changes

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
      <div className="row justify-content-center py-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h2 className="h4 mb-3">Your Cart</h2>
              <div className="alert alert-warning mb-3">
                You need to login to view your cart.
              </div>
              <button
                onClick={() => navigate("/login")}
                className="btn btn-primary"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <div>
          <h2 className="mb-1">Your Cart</h2>
          <p className="text-secondary mb-0">
            Manage items, update quantity, and checkout.
          </p>
        </div>

        <button
          onClick={onClear}
          disabled={items.length === 0 || busyId === "CLEAR"}
          className="btn btn-outline-danger"
        >
          {busyId === "CLEAR" ? "Clearing..." : "Clear Cart"}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body d-flex align-items-center gap-2 text-secondary">
            <div className="spinner-border spinner-border-sm" role="status" />
            <span>Loading cart...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h5 className="mb-2">Your cart is empty</h5>
            <p className="text-secondary mb-3">Add products to continue.</p>
            <Link to="/" className="btn btn-outline-primary">
              Continue shopping
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {/* Cart Items */}
          <div className="col-lg-8">
            <div className="d-grid gap-3">
              {items.map((it) => {
                const p = it.product;
                const price = it.priceAtAdd || p?.price || 0;
                const maxStock = p?.stock ?? it.qty;

                return (
                  <div
                    key={p?._id || Math.random()}
                    className="card border-0 shadow-sm"
                  >
                    <div className="card-body">
                      <div className="row g-3 align-items-center">
                        <div className="col-auto">
                          <img
                            src={
                              p?.image ||
                              "https://via.placeholder.com/600x400?text=No+Image"
                            }
                            alt={p?.title || "Product"}
                            className="rounded-3 cart-item-image"
                          />
                        </div>

                        <div className="col">
                          <h5 className="h6 mb-1">
                            <Link
                              to={`/product/${p?._id}`}
                              className="text-decoration-none"
                            >
                              {p?.title || "Unknown Product"}
                            </Link>
                          </h5>

                          <p className="text-secondary small mb-2">
                            {p?.brand ? `${p.brand} - ` : ""}
                            {p?.category || "General"}
                          </p>

                          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                            <div className="fw-bold">{`\u20B9${price}`}</div>

                            <div className="d-flex align-items-center gap-2">
                              <select
                                value={it.qty}
                                disabled={busyId === p?._id}
                                onChange={(e) =>
                                  onUpdateQty(p._id, Number(e.target.value))
                                }
                                className="form-select form-select-sm"
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
                                className="btn btn-outline-danger btn-sm"
                              >
                                {busyId === p?._id ? "..." : "Remove"}
                              </button>
                            </div>
                          </div>

                          <div className="small text-secondary mt-2">
                            Subtotal: <b>{`\u20B9${price * it.qty}`}</b>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm summary-sticky">
              <div className="card-body">
                <h5 className="mb-3">Order Summary</h5>

                <Row label="Items" value={`\u20B9${totals.itemsPrice}`} />
                <Row label="Shipping" value={`\u20B9${totals.shipping}`} />
                <Row label="Tax" value={`\u20B9${totals.tax}`} />

                <hr />

                <Row
                  label={<b>Total</b>}
                  value={<b>{`\u20B9${totals.total}`}</b>}
                />

                <button
                  onClick={() => navigate("/checkout")}
                  className="btn btn-primary w-100 mt-3"
                >
                  Proceed to Checkout
                </button>

                <p className="small text-secondary mt-3 mb-0">
                  Free shipping on orders ₹999+
                </p>
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
