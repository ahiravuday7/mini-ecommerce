import { useEffect, useMemo, useState } from "react";
import { fetchFaqs } from "../api/faqs.api";

// Language options list
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
];

export default function FAQs() {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]); // unique category list from backend (dropdown)
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(""); // selected category filter ("" = all)
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openFaqId, setOpenFaqId] = useState(null); // which accordion item is currently expanded
  const [refreshTick, setRefreshTick] = useState(0); //a simple trick to force reload APIs when click Refresh/Retry

  // Load categories only
  useEffect(() => {
    let alive = true; // If user leaves the page while API is pending, React warns: “Can’t perform a React state update on an unmounted component”

    const loadCategories = async () => {
      try {
        const { data } = await fetchFaqs({ lang });
        if (!alive) return; //  alive = false in cleanup, Prevents calling setState() after unmount.

        // Create unique categories
        const nextCategories = Array.from(
          new Set(
            (data?.faqs || []).map((item) => item.category).filter(Boolean), // safe fallback, extract categories, remove empty/null categories,remove duplicates,convert set back to array,convert set back to array.
          ),
        ).sort((a, b) => a.localeCompare(b));

        // Set categories and validate selected category
        // If currently selected category no longer exists (language changed), reset to “All Categories”.
        setCategories(nextCategories);
        setCategory((prev) =>
          prev && !nextCategories.includes(prev) ? "" : prev,
        );
      } catch {
        if (!alive) return;
        setCategories([]);
      }
    };

    loadCategories();

    return () => {
      alive = false;
    };
  }, [lang, refreshTick]); //categories reload

  // Load FAQs with debounce
  useEffect(() => {
    let alive = true;
    // It waits 300ms after user stops typing.
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        // Build params object
        const params = { lang };
        if (q.trim()) params.q = q.trim();
        if (category) params.category = category;

        // Call API
        const { data } = await fetchFaqs(params);
        if (!alive) return;

        // store FAQs, close any open accordion item when data changes
        setFaqs(data?.faqs || []);
        setOpenFaqId(null);
      } catch (e) {
        if (!alive) return;
        setFaqs([]);
        setError(e?.response?.data?.message || "Failed to load FAQs");
      } finally {
        if (alive) setLoading(false);
      }
    }, 300);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [q, category, lang, refreshTick]); // search text changes,category changes,language changes,refresh clicked

  // useMemo for label FAQ count
  const faqCountLabel = useMemo(() => {
    if (loading) return "Loading FAQs...";
    if (!faqs.length) return "No FAQs found";
    return `${faqs.length} FAQ${faqs.length > 1 ? "s" : ""} found`;
  }, [faqs, loading]);

  // Clear filters
  const clearFilters = () => {
    setQ("");
    setCategory("");
    setOpenFaqId(null);
  };

  return (
    <div className="py-3">
      <div className="mb-4">
        <h2 className="mb-1">FAQs</h2>
        <p className="text-secondary mb-0">
          Find answers quickly with search and category filters.
        </p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label fw-semibold mb-1">Search</label>
              <input
                className="form-control"
                placeholder="Type keywords like refund, payment, shipping..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold mb-1">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label fw-semibold mb-1">Language</label>
              <select
                className="form-select"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2 d-grid">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={clearFilters}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <small className="text-secondary">{faqCountLabel}</small>
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() => setRefreshTick((v) => v + 1)}
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="card border-0 shadow-sm">
          <div className="card-body d-flex align-items-center gap-2 text-secondary">
            <div className="spinner-border spinner-border-sm" role="status" />
            <span>Loading FAQs...</span>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between mb-0">
          <span>{error}</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => setRefreshTick((v) => v + 1)}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && faqs.length === 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h5 className="mb-2">No FAQs found</h5>
            <p className="text-secondary mb-0">
              Try changing your search text, category, or language.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && faqs.length > 0 && (
        <div className="accordion" id="faqAccordion">
          {/* Uses Mongo _id as stable key, openFaqId controls open/close behavior */}
          {faqs.map((faq, index) => {
            const id = faq._id || `faq-${index}`;
            const isOpen = openFaqId === id;

            return (
              <div className="accordion-item" key={id}>
                <h2 className="accordion-header">
                  <button
                    type="button"
                    className={`accordion-button ${isOpen ? "" : "collapsed"}`}
                    onClick={() => setOpenFaqId(isOpen ? null : id)}
                    aria-expanded={isOpen}
                  >
                    <span className="flex-grow-1 pe-3">{faq.question}</span>
                    <span className="badge text-bg-light me-3 flex-shrink-0">
                      {faq.category}
                    </span>
                  </button>
                </h2>
                <div
                  className={`accordion-collapse collapse ${isOpen ? "show" : ""}`}
                >
                  <div className="accordion-body">
                    <p className="mb-2">{faq.answer}</p>
                    <small className="text-secondary text-uppercase">
                      Language: {faq.lang || "en"}
                    </small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
