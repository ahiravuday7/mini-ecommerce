import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCart } from "../api/cart.api";
import { placeOrder } from "../api/orders.api";
import { useAuth } from "../context/AuthContext";

export default function Checkout() {
  const navigate = useNavigate();
  const { user, booting } = useAuth();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Shipping form
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  // Cart items
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
    return { itemsPrice, shipping, tax, total };
  }, [items]);

  // Load cart
  const loadCart = async () => {
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

  // Guard: if not logged in, automatically redirects the user to the login page if the app has finished checking their authentication status and confirms they are not logged in.
  useEffect(() => {
    if (!booting && !user) navigate("/login");
  }, [booting, user, navigate]);

  // Load cart when user is logged in
  useEffect(() => {
    if (!booting && user) loadCart();
  }, [booting, user]);

  // Update form fields
  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  // Validate form
  const validate = () => {
    if (!form.fullName.trim()) return "Full name is required";
    if (!form.phone.trim()) return "Phone is required";
    if (!form.addressLine1.trim()) return "Address Line 1 is required";
    if (!form.city.trim()) return "City is required";
    if (!form.state.trim()) return "State is required";
    if (!form.pincode.trim()) return "Pincode is required";
    if (items.length === 0) return "Your cart is empty";
    return "";
  };

  // Place order
  const onPlaceOrder = async (e) => {
    e.preventDefault();
    const msg = validate();
    if (msg) return setError(msg);

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        paymentMethod: "COD",
        shippingAddress: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          country: form.country.trim() || "India",
        },
      };

      const { data } = await placeOrder(payload);

      // Success -> go to Orders list (or could go to order detail page)
      navigate("/orders", { state: { justPlacedOrderId: data._id } });
    } catch (e2) {
      setError(e2?.response?.data?.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  // While auth is checking -> show message, If user is missing -> return nothing because navigate("/login") is already happening
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

  if (!user) return null; // redirecting

  return (
    <div className="py-2">
      <div className="mb-3">
        <Link to="/cart" className="btn btn-link p-0 text-decoration-none">
          &larr; Back to cart
        </Link>
      </div>

      <h2 className="mb-1">Checkout</h2>
      <p className="text-secondary">
        Enter shipping details and place your order (COD).
      </p>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body d-flex align-items-center gap-2 text-secondary">
            <div className="spinner-border spinner-border-sm" role="status" />
            <span>Loading your cart...</span>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h5 className="mb-2">Your cart is empty</h5>
            <p className="text-secondary mb-3">Add products before checkout.</p>
            <Link to="/" className="btn btn-outline-primary">
              Shop products
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {/* LEFT: Form */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="mb-3">Shipping Address</h5>

                <form onSubmit={onPlaceOrder} className="row g-3">
                  <div className="col-12">
                    <Field label="Full Name">
                      <input
                        className="form-control"
                        value={form.fullName}
                        onChange={(e) => setField("fullName", e.target.value)}
                        placeholder="Dipak Ahirav"
                      />
                    </Field>
                  </div>

                  <div className="col-12">
                    <Field label="Phone">
                      <input
                        className="form-control"
                        value={form.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                        placeholder="9999999999"
                      />
                    </Field>
                  </div>

                  <div className="col-12">
                    <Field label="Address Line 1">
                      <input
                        className="form-control"
                        value={form.addressLine1}
                        onChange={(e) =>
                          setField("addressLine1", e.target.value)
                        }
                        placeholder="House no, street, area"
                      />
                    </Field>
                  </div>

                  <div className="col-12">
                    <Field label="Address Line 2 (optional)">
                      <input
                        className="form-control"
                        value={form.addressLine2}
                        onChange={(e) =>
                          setField("addressLine2", e.target.value)
                        }
                        placeholder="Landmark"
                      />
                    </Field>
                  </div>

                  <div className="col-md-6">
                    <Field label="City">
                      <input
                        className="form-control"
                        value={form.city}
                        onChange={(e) => setField("city", e.target.value)}
                        placeholder="Surat"
                      />
                    </Field>
                  </div>

                  <div className="col-md-6">
                    <Field label="State">
                      <input
                        className="form-control"
                        value={form.state}
                        onChange={(e) => setField("state", e.target.value)}
                        placeholder="Gujarat"
                      />
                    </Field>
                  </div>

                  <div className="col-md-6">
                    <Field label="Pincode">
                      <input
                        className="form-control"
                        value={form.pincode}
                        onChange={(e) => setField("pincode", e.target.value)}
                        placeholder="395000"
                      />
                    </Field>
                  </div>

                  <div className="col-md-6">
                    <Field label="Country">
                      <input
                        className="form-control"
                        value={form.country}
                        onChange={(e) => setField("country", e.target.value)}
                        placeholder="India"
                      />
                    </Field>
                  </div>

                  <div className="col-12 d-grid mt-2">
                    <button
                      disabled={submitting}
                      className="btn btn-primary btn-lg"
                    >
                      {submitting ? "Placing Order..." : "Place Order (COD)"}
                    </button>
                  </div>

                  <div className="col-12">
                    <p className="small text-secondary mb-0">
                      Payment method: <b>Cash on Delivery</b>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm summary-sticky">
              <div className="card-body">
                <h5 className="mb-3">Order Summary</h5>

                <div className="d-grid gap-2 mb-3">
                  {items.map((it) => (
                    <div
                      key={it.product?._id}
                      className="d-flex gap-2 align-items-center"
                    >
                      <img
                        src={
                          it.product?.image ||
                          "https://via.placeholder.com/100?text=Img"
                        }
                        alt={it.product?.title || "item"}
                        className="rounded-3 summary-item-image"
                      />
                      <div className="flex-grow-1">
                        <div className="fw-semibold small">
                          {it.product?.title}
                        </div>
                        <div className="text-secondary small">
                          Qty: {it.qty} -{" "}
                          {`\u20B9${it.priceAtAdd || it.product?.price || 0}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Row label="Items" value={`\u20B9${totals.itemsPrice}`} />
                <Row label="Shipping" value={`\u20B9${totals.shipping}`} />
                <Row label="Tax" value={`\u20B9${totals.tax}`} />

                <hr />

                <Row
                  label={<b>Total</b>}
                  value={<b>{`\u20B9${totals.total}`}</b>}
                />

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

function Field({ label, children }) {
  return (
    <div>
      <label className="form-label fw-semibold mb-1">{label}</label>
      {children}
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
