import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchProducts } from "../../api/products.api";
import ProductCard from "../../components/ProductCard";
import Pagination from "../../components/Pagination";

const PRODUCTS_PER_PAGE = 6;

// Empty string ("") means “no filter applied” for that field.
const emptyFilters = {
  brand: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  minDiscount: "",
  minRating: "",
  sortBy: "",
};

// Discount calculation
const getDiscountPercent = (product) => {
  const mrp = Number(product?.mrp || 0);
  const price = Number(product?.price || 0);
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};

export default function Products() {
  const [searchParams] = useSearchParams();
  const qFromUrl = (searchParams.get("q") || "").trim(); //reads query parameters from URL
  const categoryFromUrl = (searchParams.get("category") || "").trim();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    ...emptyFilters,
    category: categoryFromUrl,
  });

  // Extract all unique brands from products and use them in filter dropdown
  const brands = useMemo(() => {
    const set = new Set(
      products.map((p) => (p.brand || "").trim()).filter(Boolean),
    );
    return ["", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  //Extract all categories from products and use them in filter dropdown
  const categories = useMemo(() => {
    const set = new Set(
      products.map((p) => (p.category || "").trim()).filter(Boolean),
    );
    return ["", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const minPrice = filters.minPrice === "" ? null : Number(filters.minPrice);
    const maxPrice = filters.maxPrice === "" ? null : Number(filters.maxPrice);
    const minDiscount =
      filters.minDiscount === "" ? null : Number(filters.minDiscount);
    const minRating =
      filters.minRating === "" ? null : Number(filters.minRating);

    // For each product p, you normalize values:
    const result = products.filter((p) => {
      const brand = (p.brand || "").trim();
      const category = (p.category || "").trim();
      const price = Number(p.price || 0);
      const rating = Number(p.rating || 0);
      const discount = getDiscountPercent(p);

      if (filters.brand && brand !== filters.brand) return false; //Brand filter
      if (filters.category && category !== filters.category) return false; //Category filter
      if (minPrice !== null && price < minPrice) return false; //Min price
      if (maxPrice !== null && price > maxPrice) return false; //Max price
      if (minDiscount !== null && discount < minDiscount) return false; //Min discount
      if (minRating !== null && rating < minRating) return false; //Min rating

      return true;
    });

    // Sorting happens after filtering
    if (filters.sortBy === "newToOld") {
      result.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    } else if (filters.sortBy === "priceLowToHigh") {
      result.sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0));
    } else if (filters.sortBy === "priceHighToLow") {
      result.sort((a, b) => Number(b?.price || 0) - Number(a?.price || 0));
    }

    return result;
  }, [products, filters]);

  // Total pages depends on filtered count:
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)),
    [filteredProducts.length],
  );

  //Current page items:
  const currentProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const resultStart =
    filteredProducts.length === 0 //If no data exists -> return 0, Otherwise -> calculate values
      ? 0
      : (currentPage - 1) * PRODUCTS_PER_PAGE + 1;
  const resultEnd =
    filteredProducts.length === 0
      ? 0
      : resultStart + currentProducts.length - 1;

  const load = async (params = {}) => {
    try {
      setLoading(true);
      setError("");
      const { data } = await fetchProducts(params);
      setProducts(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Whenever category in URL changes -> update filter state
  useEffect(() => {
    setFilters((prev) => ({ ...prev, category: categoryFromUrl }));
  }, [categoryFromUrl]);

  //So when user applies filters, they go back to page 1 automatically
  useEffect(() => {
    setCurrentPage(1);
  }, [qFromUrl, filters]);

  // When filters change -> number of products changes - total pages change
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = {};
      if (qFromUrl) params.q = qFromUrl;
      load(params);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qFromUrl]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
  };

  return (
    <div className="py-2">
      <div className="mb-4">
        <h2 className="mb-1">Products</h2>
        <p className="text-secondary mb-0">
          Browse products with advanced filters.
        </p>
        <p className="small text-secondary mb-0 mt-1">
          {`${resultStart}-${resultEnd} of ${filteredProducts.length.toLocaleString()} results${
            qFromUrl ? ` for "${qFromUrl}"` : ""
          }`}
        </p>
      </div>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => setShowFilters((v) => !v)}
        >
          {showFilters ? "Hide Filters" : "Filter"}
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </div>

      {showFilters && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Brand</label>
                <select
                  className="form-select"
                  value={filters.brand}
                  onChange={(e) => setFilter("brand", e.target.value)}
                >
                  {brands.map((b) => (
                    <option key={b || "all-brands"} value={b}>
                      {b || "All Brands"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category filter */}
              <div className="col-md-4">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={filters.category}
                  onChange={(e) => setFilter("category", e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c || "all-categories"} value={c}>
                      {c || "All Categories"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label">Min Price</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={filters.minPrice}
                  onChange={(e) => setFilter("minPrice", e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">Max Price</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={filters.maxPrice}
                  onChange={(e) => setFilter("maxPrice", e.target.value)}
                  placeholder="99999"
                />
              </div>

              <div className="col-md-3">
                <label className="form-label">Discount</label>
                <select
                  className="form-select"
                  value={filters.minDiscount}
                  onChange={(e) => setFilter("minDiscount", e.target.value)}
                >
                  <option value="">Any Discount</option>
                  <option value="10">10% & above</option>
                  <option value="20">20% & above</option>
                  <option value="30">30% & above</option>
                  <option value="40">40% & above</option>
                  <option value="50">50% & above</option>
                  <option value="60">60% & above</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Rating</label>
                <select
                  className="form-select"
                  value={filters.minRating}
                  onChange={(e) => setFilter("minRating", e.target.value)}
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ rating</option>
                  <option value="3">3+ rating</option>
                  <option value="2">2+ rating</option>
                  <option value="1">1+ rating</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Sort By</label>
                <select
                  className="form-select"
                  value={filters.sortBy}
                  onChange={(e) => setFilter("sortBy", e.target.value)}
                >
                  <option value="">Default</option>
                  <option value="newToOld">New Arrivals</option>
                  <option value="priceLowToHigh">Price: Low to High</option>
                  <option value="priceHighToLow">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {!loading && !error && filteredProducts.length === 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h5 className="mb-2">No products found</h5>
            <p className="text-secondary mb-0">
              Try changing your filter combination.
            </p>
          </div>
        </div>
      )}

      {/* Grid of products */}
      {!loading && !error && filteredProducts.length > 0 && (
        <>
          <div className="row g-4">
            {currentProducts.map((p) => (
              <div className="col-sm-6 col-lg-4" key={p._id}>
                <ProductCard p={p} />
              </div>
            ))}
          </div>

          <div className="d-flex justify-content-center mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
