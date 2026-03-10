import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../api/products.api";

const DEAL_LIMIT = 12;
const PLACEHOLDER_COUNT = 8;

// Calculate discount per product
const getDiscountPercent = (product) => {
  const mrp = Number(product?.mrp || 0);
  const price = Number(product?.price || 0);
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};

const DealCard = ({ product }) => {
  const discount = getDiscountPercent(product);
  const mrp = Number(product?.mrp || 0);
  const price = Number(product?.price || 0);

  return (
    <div className="card border-0 shadow-sm h-100 deal-card">
      <Link
        to={`/product/${product._id}`}
        className="text-decoration-none text-dark h-100 d-flex flex-column"
      >
        <div className="deal-card-img-wrap bg-light">
          <img
            src={product?.image || "/vite.svg"}
            alt={product?.title || "Product"}
            className="deal-card-img"
            loading="lazy"
          />
        </div>

        <div className="card-body p-3 d-flex flex-column">
          <h6 className="deal-card-title fw-semibold mb-2">
            {product?.title || "Untitled Product"}
          </h6>

          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="fw-bold">{`\u20B9${price}`}</span>
            {mrp > price && (
              <span className="text-secondary text-decoration-line-through small">
                {`\u20B9${mrp}`}
              </span>
            )}
          </div>

          <div className="small mt-auto">
            {discount > 0 ? (
              <span className="text-success fw-semibold">{`${discount}% off`}</span>
            ) : (
              <span className="text-secondary">Best value</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default function SectionDealsHome() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all products once on mount
  useEffect(() => {
    let cancelled = false;

    const loadDeals = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await fetchProducts();
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.message || "Failed to load deals");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDeals();
    return () => {
      cancelled = true;
    };
  }, []);

  // all fetched products
  const dealProducts = useMemo(() => {
    return [...products]
      .filter((p) => Number(p?.stock || 0) > 0) //Keep only in-stock products
      .sort((a, b) => {
        const discountDiff = getDiscountPercent(b) - getDiscountPercent(a); //Sort by highest discount first
        if (discountDiff !== 0) return discountDiff;
        return Number(b?.rating || 0) - Number(a?.rating || 0); //If discount ties, sort by highest rating
      })
      .slice(0, DEAL_LIMIT); //Take top 12 only
  }, [products]);

  return (
    <section className="section2 bg-light py-4">
      <div className="container">
        <h4 className="fw-bold mb-3 text-dark">
          Hot Deals For You{" "}
          <i className="bi bi-arrow-right-circle-fill text-primary" />
        </h4>
        {/* Loading skeleton cards */}
        {loading && (
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
            {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
              <div className="col" key={`deal-placeholder-${i}`}>
                <div className="card border-0 shadow-sm h-100 placeholder-glow deal-card">
                  <div className="deal-card-img-wrap placeholder" />
                  <div className="card-body p-3">
                    <span className="placeholder col-10 d-block mb-2" />
                    <span className="placeholder col-6 d-block mb-2" />
                    <span className="placeholder col-4 d-block" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Error alert */}
        {!loading && error && (
          <div className="alert alert-danger mb-0" role="alert">
            {error}
          </div>
        )}
        {/* Empty state if no deals  */}
        {!loading && !error && dealProducts.length === 0 && (
          <div className="card border-0 shadow-sm">
            <div className="card-body py-4 text-secondary">
              No deals available right now.
            </div>
          </div>
        )}
        {/* Otherwise renders deal cards */}
        {!loading && !error && dealProducts.length > 0 && (
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
            {dealProducts.map((product) => (
              <div className="col" key={product._id}>
                <DealCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
