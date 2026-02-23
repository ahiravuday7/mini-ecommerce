import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCart } from "../api/cart.api";
import { placeOrder } from "../api/orders.api";
import { useAuth } from "../context/AuthContext";

const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 10,
  width: "100%",
  outline: "none",
};

const card = {
  border: "1px solid #eee",
  borderRadius: 14,
  background: "white",
};

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

      // Success → go to Orders list (or could go to order detail page)
      navigate("/orders", { state: { justPlacedOrderId: data._id } });
    } catch (e2) {
      setError(e2?.response?.data?.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  // While auth is checking → show message, If user is missing → return nothing because navigate("/login") is already happening
  if (booting) return <div>Checking session...</div>;
  if (!user) return null; // redirecting

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link to="/cart" style={{ textDecoration: "none" }}>
          ← Back to cart
        </Link>
      </div>

      <h2 style={{ margin: "6px 0 2px" }}>Checkout</h2>
      <div style={{ color: "#666", fontSize: 14 }}>
        Enter shipping details and place your order (COD).
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
        <div style={{ marginTop: 12 }}>Loading your cart...</div>
      ) : items.length === 0 ? (
        <div style={{ marginTop: 14 }}>
          Your cart is empty. <Link to="/">Shop products</Link>
        </div>
      ) : (
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "1fr 0.9fr",
            gap: 14,
            alignItems: "start",
          }}
        >
          {/* LEFT: Form */}
          <div style={{ ...card, padding: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
              Shipping Address
            </div>

            <form onSubmit={onPlaceOrder} style={{ display: "grid", gap: 12 }}>
              <Field label="Full Name">
                <input
                  style={inputStyle}
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  placeholder="Dipak Ahirav"
                />
              </Field>

              <Field label="Phone">
                <input
                  style={inputStyle}
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="9999999999"
                />
              </Field>

              <Field label="Address Line 1">
                <input
                  style={inputStyle}
                  value={form.addressLine1}
                  onChange={(e) => setField("addressLine1", e.target.value)}
                  placeholder="House no, street, area"
                />
              </Field>

              <Field label="Address Line 2 (optional)">
                <input
                  style={inputStyle}
                  value={form.addressLine2}
                  onChange={(e) => setField("addressLine2", e.target.value)}
                  placeholder="Landmark"
                />
              </Field>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <Field label="City">
                  <input
                    style={inputStyle}
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    placeholder="Surat"
                  />
                </Field>

                <Field label="State">
                  <input
                    style={inputStyle}
                    value={form.state}
                    onChange={(e) => setField("state", e.target.value)}
                    placeholder="Gujarat"
                  />
                </Field>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <Field label="Pincode">
                  <input
                    style={inputStyle}
                    value={form.pincode}
                    onChange={(e) => setField("pincode", e.target.value)}
                    placeholder="395000"
                  />
                </Field>

                <Field label="Country">
                  <input
                    style={inputStyle}
                    value={form.country}
                    onChange={(e) => setField("country", e.target.value)}
                    placeholder="India"
                  />
                </Field>
              </div>

              <button
                disabled={submitting}
                style={{
                  marginTop: 6,
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                {submitting ? "Placing Order..." : "Place Order (COD)"}
              </button>

              <div style={{ fontSize: 13, color: "#666" }}>
                Payment method: <b>Cash on Delivery</b>
              </div>
            </form>
          </div>

          {/* RIGHT: Summary */}
          <div style={{ ...card, padding: 14, position: "sticky", top: 84 }}>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>
              Order Summary
            </div>

            <div style={{ display: "grid", gap: 10, marginBottom: 10 }}>
              {items.map((it) => (
                <div
                  key={it.product?._id}
                  style={{ display: "flex", gap: 10, alignItems: "center" }}
                >
                  <img
                    src={
                      it.product?.image ||
                      "https://via.placeholder.com/100?text=Img"
                    }
                    alt={it.product?.title || "item"}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 10,
                      objectFit: "cover",
                      background: "#fafafa",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>
                      {it.product?.title}
                    </div>
                    <div style={{ color: "#666", fontSize: 12 }}>
                      Qty: {it.qty} • ₹{it.priceAtAdd || it.product?.price || 0}
                    </div>
                  </div>
                </div>
              ))}
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

            <div style={{ marginTop: 10, fontSize: 13, color: "#666" }}>
              Free shipping on orders ₹999+
            </div>
          </div>

          <style>{`
            @media (max-width: 900px) {
              div[style*="grid-template-columns: 1fr 0.9fr"] {
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

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ fontSize: 13, color: "#444", fontWeight: 700 }}>
        {label}
      </label>
      {children}
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
