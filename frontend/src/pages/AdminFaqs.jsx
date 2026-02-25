import { useEffect, useMemo, useState } from "react";
import {
  adminCreateFaq,
  adminDeleteFaq,
  adminFetchFaqs,
  adminToggleFaq,
  adminUpdateFaq,
} from "../api/faqs.api";

// Helper functions (reusable utilities)
const createEmptyFaq = () => ({
  category: "",
  question: "",
  answer: "",
  lang: "en",
  isActive: true,
  order: 0,
  tagsText: "",
});

// used for tags
const parseTags = (value) =>
  (value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

export default function AdminFaqs() {
  // FAQ list + UI state
  const [faqs, setFaqs] = useState([]); // array of FAQs from backend
  const [loading, setLoading] = useState(true); // show loader
  const [error, setError] = useState(""); // show red alert
  const [msg, setMsg] = useState(""); //show success message

  // Filters / Search
  const [q, setQ] = useState(""); //search text
  const [categoryFilter, setCategoryFilter] = useState(""); // category dropdown filter
  const [langFilter, setLangFilter] = useState(""); //language dropdown filter
  const [isActiveFilter, setIsActiveFilter] = useState(""); //active/inactive dropdown filter
  const [refreshTick, setRefreshTick] = useState(0); //when you click Refresh, increase this number so useEffect runs again.

  // Create form state
  const [creating, setCreating] = useState(false); //disables button and shows "Creating..."
  const [newFaq, setNewFaq] = useState(createEmptyFaq()); //holds current create-form input values.

  // Edit state
  const [editingId, setEditingId] = useState(""); //tells which FAQ card is in edit mode
  const [editFaq, setEditFaq] = useState(null); // holds edit form values
  const [savingEdit, setSavingEdit] = useState(false); //disables save button while API is running

  // Fetch FAQs whenever filters/search/refresh changes (useEffect),debounce-It waits 300ms before calling API.
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const params = {};
        if (q.trim()) params.q = q.trim();
        if (categoryFilter.trim()) params.category = categoryFilter.trim();
        if (langFilter) params.lang = langFilter;
        if (isActiveFilter !== "") params.isActive = isActiveFilter;

        const { data } = await adminFetchFaqs(params);
        if (!alive) return;

        setFaqs(data?.faqs || []);
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
  }, [q, categoryFilter, langFilter, isActiveFilter, refreshTick]);

  // Categories list from current FAQ list
  const categories = useMemo(() => {
    const set = new Set(faqs.map((faq) => faq.category).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [faqs]);

  // Loading... while fetching or number of FAQs
  const totalLabel = useMemo(() => {
    if (loading) return "Loading...";
    return `${faqs.length}`;
  }, [faqs.length, loading]);

  const setNewField = (key, value) =>
    setNewFaq((prev) => ({ ...prev, [key]: value }));
  const setEditField = (key, value) =>
    setEditFaq((prev) => ({ ...prev, [key]: value }));

  // Resets all filters -> triggers useEffect -> reloads all FAQs.
  const clearFilters = () => {
    setQ("");
    setCategoryFilter("");
    setLangFilter("");
    setIsActiveFilter("");
  };

  // Checks required fields
  const validateFaq = (payload) => {
    if (!payload.category.trim()) return "Category is required";
    if (!payload.question.trim()) return "Question is required";
    if (!payload.answer.trim()) return "Answer is required";
    return "";
  };

  // Creates backend-ready payload
  const buildPayload = (source) => ({
    category: source.category.trim(),
    question: source.question.trim(),
    answer: source.answer.trim(),
    lang: source.lang || "en",
    isActive: Boolean(source.isActive),
    order: Number.isNaN(Number(source.order)) ? 0 : Number(source.order),
    tags: parseTags(source.tagsText),
  });

  // Create FAQs , Prevent page reload,validate,call API,reset form,refresh list
  const onCreate = async (e) => {
    e.preventDefault();
    const validationError = validateFaq(newFaq);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setCreating(true);
      setError("");
      setMsg("");
      await adminCreateFaq(buildPayload(newFaq));
      setMsg("FAQ created");
      setNewFaq(createEmptyFaq());
      setRefreshTick((prev) => prev + 1);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create FAQ");
    } finally {
      setCreating(false);
    }
  };

  // edit FAQ from faqId
  const startEdit = (faq) => {
    setError("");
    setMsg("");
    setEditingId(faq._id);
    setEditFaq({
      category: faq.category || "",
      question: faq.question || "",
      answer: faq.answer || "",
      lang: faq.lang || "en",
      isActive: Boolean(faq.isActive),
      order: faq.order ?? 0,
      tagsText: Array.isArray(faq.tags) ? faq.tags.join(", ") : "",
    });
  };

  // close edit mode
  const cancelEdit = () => {
    setEditingId("");
    setEditFaq(null);
  };

  // save edit
  const onSaveEdit = async () => {
    if (!editingId || !editFaq) return;

    // check validation
    const validationError = validateFaq(editFaq);
    if (validationError) {
      setError(validationError);
      return;
    }

    // call update API
    try {
      setSavingEdit(true);
      setError("");
      setMsg("");
      await adminUpdateFaq(editingId, buildPayload(editFaq));
      setMsg("FAQ updated");
      cancelEdit();
      setRefreshTick((prev) => prev + 1);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update FAQ");
    } finally {
      setSavingEdit(false);
    }
  };

  //Calls API to flip active/inactive and refresh list.
  const onToggle = async (id) => {
    try {
      setError("");
      setMsg("");
      await adminToggleFaq(id);
      setMsg("FAQ status updated");
      setRefreshTick((prev) => prev + 1);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to toggle FAQ status");
    }
  };

  // Shows confirm dialog, then delete API, refresh list.
  const onDelete = async (id) => {
    const ok = window.confirm("Delete this FAQ?");
    if (!ok) return;

    try {
      setError("");
      setMsg("");
      await adminDeleteFaq(id);
      setMsg("FAQ deleted");
      if (editingId === id) cancelEdit();
      setRefreshTick((prev) => prev + 1);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete FAQ");
    }
  };

  return (
    <div className="py-2">
      <h2 className="mb-1">Admin - FAQs</h2>
      <p className="text-secondary">
        Manage FAQ entries with create, update, toggle, and delete actions.
      </p>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {msg && (
        <div className="alert alert-success" role="alert">
          {msg}
        </div>
      )}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h5 className="mb-3">Create FAQ</h5>
          <form onSubmit={onCreate} className="row g-3">
            <div className="col-md-6">
              <Field label="Category">
                <input
                  className="form-control"
                  value={newFaq.category}
                  onChange={(e) => setNewField("category", e.target.value)}
                  placeholder="Orders & Shipping"
                />
              </Field>
            </div>

            <div className="col-md-3">
              <Field label="Language">
                <select
                  className="form-select"
                  value={newFaq.lang}
                  onChange={(e) => setNewField("lang", e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </Field>
            </div>

            <div className="col-md-3">
              <Field label="Order">
                <input
                  type="number"
                  className="form-control"
                  value={newFaq.order}
                  onChange={(e) => setNewField("order", e.target.value)}
                />
              </Field>
            </div>

            <div className="col-12">
              <Field label="Question">
                <input
                  className="form-control"
                  value={newFaq.question}
                  onChange={(e) => setNewField("question", e.target.value)}
                  placeholder="How can I track my order?"
                />
              </Field>
            </div>

            <div className="col-12">
              <Field label="Answer">
                <textarea
                  className="form-control"
                  rows={4}
                  value={newFaq.answer}
                  onChange={(e) => setNewField("answer", e.target.value)}
                  placeholder="You can track your order from My Orders page..."
                />
              </Field>
            </div>

            <div className="col-md-8">
              <Field label="Tags (comma separated)">
                <input
                  className="form-control"
                  value={newFaq.tagsText}
                  onChange={(e) => setNewField("tagsText", e.target.value)}
                  placeholder="tracking, delivery, order"
                />
              </Field>
            </div>

            <div className="col-md-4 d-flex align-items-end">
              <div className="form-check mb-2">
                <input
                  id="new-faq-active"
                  type="checkbox"
                  className="form-check-input"
                  checked={newFaq.isActive}
                  onChange={(e) => setNewField("isActive", e.target.checked)}
                />
                <label htmlFor="new-faq-active" className="form-check-label">
                  Active FAQ
                </label>
              </div>
            </div>

            <div className="col-12 d-grid d-sm-block mt-2">
              <button disabled={creating} className="btn btn-primary">
                {creating ? "Creating..." : "Create FAQ"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <Field label="Search">
                <input
                  className="form-control"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search question, answer, tags..."
                />
              </Field>
            </div>

            <div className="col-md-3">
              <Field label="Category">
                <select
                  className="form-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="col-md-2">
              <Field label="Language">
                <select
                  className="form-select"
                  value={langFilter}
                  onChange={(e) => setLangFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </Field>
            </div>

            <div className="col-md-2">
              <Field label="Status">
                <select
                  className="form-select"
                  value={isActiveFilter}
                  onChange={(e) => setIsActiveFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </Field>
            </div>

            <div className="col-md-1 d-grid">
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
        <h5 className="mb-0">FAQs ({totalLabel})</h5>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => setRefreshTick((prev) => prev + 1)}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body d-flex align-items-center gap-2 text-secondary">
            <div className="spinner-border spinner-border-sm" role="status" />
            <span>Loading FAQs...</span>
          </div>
        </div>
      ) : faqs.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h5 className="mb-2">No FAQs found</h5>
            <p className="text-secondary mb-0">
              Create a FAQ or update your filter criteria.
            </p>
          </div>
        </div>
      ) : (
        <div className="d-grid gap-3">
          {faqs.map((faq) => (
            <div key={faq._id} className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex flex-column flex-lg-row gap-3 justify-content-between">
                  <div className="flex-grow-1">
                    <h6 className="mb-2">{faq.question}</h6>
                    <p className="text-secondary mb-2">{faq.answer}</p>
                    <div className="d-flex flex-wrap gap-2">
                      <span className="badge text-bg-light">
                        {faq.category}
                      </span>
                      <span className="badge text-bg-light text-uppercase">
                        {faq.lang}
                      </span>
                      <span
                        className={`badge ${
                          faq.isActive ? "text-bg-success" : "text-bg-secondary"
                        }`}
                      >
                        {faq.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="badge text-bg-light">
                        Order: {faq.order ?? 0}
                      </span>
                      {(faq.tags || []).map((tag) => (
                        <span
                          key={`${faq._id}-${tag}`}
                          className="badge text-bg-info"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 align-items-start">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => startEdit(faq)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        faq.isActive
                          ? "btn-outline-warning"
                          : "btn-outline-success"
                      }`}
                      onClick={() => onToggle(faq._id)}
                    >
                      {faq.isActive ? "Set Inactive" : "Set Active"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => onDelete(faq._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Show edit form only for the FAQ whose id matches the currently editing id , Also ensure the edit form state object exists (not null).*/}
                {editingId === faq._id && editFaq && (
                  <div className="border-top mt-3 pt-3">
                    <h6 className="mb-3">Edit FAQ</h6>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <Field label="Category">
                          <input
                            className="form-control"
                            value={editFaq.category}
                            onChange={(e) =>
                              setEditField("category", e.target.value)
                            }
                          />
                        </Field>
                      </div>

                      <div className="col-md-3">
                        <Field label="Language">
                          <select
                            className="form-select"
                            value={editFaq.lang}
                            onChange={(e) =>
                              setEditField("lang", e.target.value)
                            }
                          >
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                          </select>
                        </Field>
                      </div>

                      <div className="col-md-3">
                        <Field label="Order">
                          <input
                            type="number"
                            className="form-control"
                            value={editFaq.order}
                            onChange={(e) =>
                              setEditField("order", e.target.value)
                            }
                          />
                        </Field>
                      </div>

                      <div className="col-12">
                        <Field label="Question">
                          <input
                            className="form-control"
                            value={editFaq.question}
                            onChange={(e) =>
                              setEditField("question", e.target.value)
                            }
                          />
                        </Field>
                      </div>

                      <div className="col-12">
                        <Field label="Answer">
                          <textarea
                            className="form-control"
                            rows={4}
                            value={editFaq.answer}
                            onChange={(e) =>
                              setEditField("answer", e.target.value)
                            }
                          />
                        </Field>
                      </div>

                      <div className="col-md-8">
                        <Field label="Tags (comma separated)">
                          <input
                            className="form-control"
                            value={editFaq.tagsText}
                            onChange={(e) =>
                              setEditField("tagsText", e.target.value)
                            }
                          />
                        </Field>
                      </div>

                      <div className="col-md-4 d-flex align-items-end">
                        <div className="form-check mb-2">
                          <input
                            id={`edit-active-${faq._id}`}
                            type="checkbox"
                            className="form-check-input"
                            checked={editFaq.isActive}
                            onChange={(e) =>
                              setEditField("isActive", e.target.checked)
                            }
                          />
                          <label
                            htmlFor={`edit-active-${faq._id}`}
                            className="form-check-label"
                          >
                            Active FAQ
                          </label>
                        </div>
                      </div>

                      <div className="col-12 d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="btn btn-outline-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={onSaveEdit}
                          className="btn btn-primary"
                          disabled={savingEdit}
                        >
                          {savingEdit ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
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
