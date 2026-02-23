import { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "../api/products.api";
import ProductCard from "../components/ProductCard";

const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 10,
  width: "100%",
  outline: "none",
};

export default function Home() {
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
    <div>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: "6px 0 2px" }}>Products</h2>
        <div style={{ color: "#666", fontSize: 14 }}>
          Search and filter products (powered by backend API)
        </div>
      </div>
      {/* Filters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 220px",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <input
          style={inputStyle}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products (e.g. shoes, band, bottle...)"
        />

        <select
          style={inputStyle}
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
      {/* States loading, error, empty */}
      {loading && <div>Loading products...</div>}
      {error && (
        <div
          style={{
            background: "#fff3f3",
            border: "1px solid #ffd0d0",
            padding: 12,
            borderRadius: 10,
            color: "#a40000",
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}
      {!loading && !error && products.length === 0 && (
        <div style={{ color: "#666" }}>No products found.</div>
      )}
      {/* Grid of products */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {products.map((p) => (
          <ProductCard key={p._id} p={p} />
        ))}
      </div>
    </div>
  );
}
