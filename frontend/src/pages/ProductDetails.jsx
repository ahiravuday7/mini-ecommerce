import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchProductById } from "../api/products.api";
import { addToCart } from "../api/cart.api";

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

      setActionMsg("Added to cart"); // success message
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

  if (loading) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body d-flex align-items-center gap-2 text-secondary">
          <div className="spinner-border spinner-border-sm" role="status" />
          <span>Loading product...</span>
        </div>
      </div>
    );
  }

  if (error) return <div className="alert alert-danger mb-0">{error}</div>;
  if (!p)
    return <div className="alert alert-secondary mb-0">Product not found</div>;

  return (
    <div className="py-2">
      {/* Back to products link */}
      <div className="mb-3">
        <Link to="/" className="btn btn-link p-0 text-decoration-none">
          &larr; Back to products
        </Link>
      </div>

      <div className="row g-4 align-items-start">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm">
            {/* Product image */}
            <div className="bg-light d-flex align-items-center justify-content-center p-4 product-detail-image-wrap">
              <img
                src={
                  p.image || "https://via.placeholder.com/600x400?text=No+Image"
                }
                alt={p.title}
                className="product-detail-image"
              />
            </div>
          </div>
        </div>

        {/* Product details */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h2 className="h3 mb-2">{p.title}</h2>

              {/* eg. Nike - Shoes */}
              <p className="text-secondary mb-2">
                {p.brand ? `${p.brand} - ` : ""}
                {p.category || "General"}
              </p>

              <div className="d-flex align-items-baseline gap-2 mb-2">
                <span className="fw-bold fs-3">{`\u20B9${p.price}`}</span>
                {p.mrp > p.price && (
                  <span className="text-secondary text-decoration-line-through">
                    {`\u20B9${p.mrp}`}
                  </span>
                )}
              </div>

              <div
                className={`mb-3 ${p.stock > 0 ? "text-success" : "text-danger"}`}
              >
                {p.stock > 0 ? `In stock (${p.stock})` : "Out of stock"}
              </div>

              <p className="text-body-secondary mb-4">
                {p.description || "No description provided."}
              </p>

              <hr className="my-4" />

              <div className="row g-3 align-items-end">
                {/* Qty dropdown */}
                <div className="col-sm-4">
                  <label className="form-label">Qty</label>
                  <select
                    className="form-select"
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

                {/* Add to cart button */}
                <div className="col-sm-8 d-grid">
                  <button
                    onClick={onAddToCart}
                    disabled={p.stock <= 0 || adding}
                    className="btn btn-primary btn-lg"
                  >
                    {adding ? "Adding..." : "Add to Cart"}
                  </button>
                </div>
              </div>

              {/* Success/error messages */}
              {actionMsg && (
                <div className="alert alert-success mt-3 mb-0" role="alert">
                  {actionMsg}
                </div>
              )}

              {actionErr && (
                <div className="alert alert-danger mt-3 mb-0" role="alert">
                  {actionErr}
                </div>
              )}

              {/* If user is not logged in, show login button */}
              {actionErr.toLowerCase().includes("login") && (
                <button
                  onClick={() => navigate("/login")}
                  className="btn btn-outline-secondary mt-3"
                >
                  Go to Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
