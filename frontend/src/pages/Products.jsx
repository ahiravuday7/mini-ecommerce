import { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "../api/products.api";
import ProductCard from "../components/ProductCard";

export default function Products() {
  const [products, setProducts] = useState([]); // list of products from backend
  const [loading, setLoading] = useState(true); //show loader while fetching
  const [error, setError] = useState(""); // show error message if API fails

  const [q, setQ] = useState(""); // search query (user types)
  const [category, setCategory] = useState(""); // selected category from dropdown

  // categories from current products list
  // With useMemo, it recalculates only when products changes.
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return ["", ...Array.from(set)];
  }, [products]);

  const load = async (params = {}) => {
    try {
      setLoading(true); // Start loading
      setError(""); // Clear old error
      const { data } = await fetchProducts(params); // Call API
      setProducts(data); // Store products in state
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false); //always stop loading (success or fail)
    }
  };

  useEffect(() => {
    load(); // initial load on page open
  }, []);

  // Apply filters with small debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = {};
      if (q.trim()) params.q = q.trim(); // trim() removes whitespace from start/end
      if (category) params.category = category;
      load(params);
    }, 300); // wait 300ms then call backend with params (after you stop typing)

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category]);

  return (
    <div className="py-2">
      <div className="mb-4">
        <h2 className="mb-1">Products</h2>
        <p className="text-secondary mb-0">
          Search and filter products (powered by backend API)
        </p>
      </div>

      {/* Filters */}
      <div className="row g-3 mb-4">
        {/* Search */}
        <div className="col-md-8">
          <input
            className="form-control"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products (e.g. shoes, band, bottle...)"
          />
        </div>

        {/* Category filter */}
        <div className="col-md-4">
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c || "all"} value={c}>
                {c ? c : "All Categories"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* States loading, error, empty */}
      {loading && (
        <div className="card border-0 shadow-sm">
          <div className="card-body d-flex align-items-center gap-2 text-secondary">
            <div className="spinner-border spinner-border-sm" role="status" />
            <span>Loading products...</span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h5 className="mb-2">No products found</h5>
            <p className="text-secondary mb-0">
              Try a different search or category filter.
            </p>
          </div>
        </div>
      )}

      {/* Grid of products */}
      {!loading && !error && products.length > 0 && (
        <div className="row g-4">
          {products.map((p) => (
            <div className="col-sm-6 col-lg-4" key={p._id}>
              <ProductCard p={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
