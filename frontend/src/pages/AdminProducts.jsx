import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from "../api/products.api";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  // Create form
  const [creating, setCreating] = useState(false);
  const [newP, setNewP] = useState({
    title: "",
    brand: "",
    category: "General",
    description: "",
    price: "",
    mrp: "",
    stock: "",
    image: "",
  });

  // Edit form
  const [editingId, setEditingId] = useState("");
  const [editP, setEditP] = useState(null);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean)); // Extract categories from products, Remove empty values, Remove duplicates using Set
    return ["General", ...Array.from(set).filter((x) => x !== "General")]; // "General" always appears first, No duplicate "General" , Convert Set -> Array
  }, [products]);

  //
  const load = async () => {
    try {
      setLoading(true); // Start loading state
      // Reset previous states
      setError("");
      setMsg("");
      const { data } = await fetchProducts(); // Calls backend
      setProducts(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Run load() only once when component mounts
  useEffect(() => {
    load();
  }, []);

  // It uses a functional state update and computed property names to update a single field without mutating or overwriting the existing state.
  const setNewField = (k, v) => setNewP((p) => ({ ...p, [k]: v }));

  // Validate new product form
  const validateNew = () => {
    if (!newP.title.trim()) return "Title is required";
    if (newP.price === "" || Number(newP.price) < 0)
      return "Valid price is required";
    return "";
  };

  // Create new product
  const onCreate = async (e) => {
    e.preventDefault(); //stops form refresh
    const v = validateNew(); // if invalid, show error and stop
    if (v) return setError(v);

    try {
      setCreating(true); // disables button / shows "Creating..."
      setError("");
      setMsg("");

      const payload = {
        ...newP,
        title: newP.title.trim(),
        price: Number(newP.price),
        // converts price/mrp/stock to numbers, defaults empty mrp/stock to 0
        mrp: newP.mrp === "" ? 0 : Number(newP.mrp),
        stock: newP.stock === "" ? 0 : Number(newP.stock),
      };

      // API call
      await createProduct(payload);
      setMsg("Product created");
      setNewP({
        title: "",
        brand: "",
        category: "General",
        description: "",
        price: "",
        mrp: "",
        stock: "",
        image: "",
      });
      await load(); // to refresh list
    } catch (e2) {
      setError(
        e2?.response?.data?.message ||
          "Failed to create product (Are you admin?)",
      );
    } finally {
      setCreating(false);
    }
  };

  // Edit product
  const startEdit = (p) => {
    setMsg("");
    setError("");
    setEditingId(p._id); // Only one product is editable at a time
    setEditP({
      title: p.title || "",
      brand: p.brand || "",
      category: p.category || "General",
      description: p.description || "",
      price: p.price ?? 0,
      mrp: p.mrp ?? 0,
      stock: p.stock ?? 0,
      image: p.image || "",
    });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId("");
    setEditP(null);
  };

  // This updates a single field inside the editP object state dynamically while keeping the rest of the edit form data unchanged (immutable update using spread + computed key).
  const setEditField = (k, v) => setEditP((p) => ({ ...p, [k]: v }));

  // Save edit
  const onSaveEdit = async () => {
    if (!editingId || !editP) return;

    if (!editP.title.trim()) return setError("Title is required");
    if (editP.price === "" || Number(editP.price) < 0)
      return setError("Valid price is required");

    try {
      setError("");
      setMsg("");
      const payload = {
        ...editP,
        title: editP.title.trim(),
        price: Number(editP.price),
        mrp: editP.mrp === "" ? 0 : Number(editP.mrp),
        stock: editP.stock === "" ? 0 : Number(editP.stock),
      };

      await updateProduct(editingId, payload);
      setMsg("Product updated");
      cancelEdit();
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update product");
    }
  };

  // Delete product
  const onDelete = async (id) => {
    const ok = window.confirm("Delete this product?");
    if (!ok) return;

    try {
      setError("");
      setMsg("");
      await deleteProduct(id);
      setMsg("Product deleted");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete product");
    }
  };

  return (
    <div className="py-2">
      <h2 className="mb-1">Admin - Products</h2>
      <p className="text-secondary">Create, update and delete products.</p>

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

      {/* Create */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h5 className="mb-3">Create Product</h5>

          <form onSubmit={onCreate} className="row g-3">
            <div className="col-md-6">
              <Field label="Title">
                <input
                  className="form-control"
                  value={newP.title}
                  onChange={(e) => setNewField("title", e.target.value)}
                  placeholder="Wireless Mouse"
                />
              </Field>
            </div>

            <div className="col-md-6">
              <Field label="Brand">
                <input
                  className="form-control"
                  value={newP.brand}
                  onChange={(e) => setNewField("brand", e.target.value)}
                  placeholder="ClickPro"
                />
              </Field>
            </div>

            <div className="col-md-6">
              <Field label="Category">
                <select
                  className="form-select"
                  value={newP.category}
                  onChange={(e) => setNewField("category", e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="col-md-6">
              <Field label="Image URL">
                <input
                  className="form-control"
                  value={newP.image}
                  onChange={(e) => setNewField("image", e.target.value)}
                  placeholder="https://..."
                />
              </Field>
            </div>

            <div className="col-12">
              <Field label="Description">
                <textarea
                  className="form-control"
                  value={newP.description}
                  onChange={(e) => setNewField("description", e.target.value)}
                  placeholder="Short product description..."
                  maxLength={500}
                  rows={3}
                />
                <div className="small text-secondary text-end mt-1">
                  {newP.description.length}/500
                </div>
              </Field>
            </div>

            <div className="col-md-4">
              <Field label="Price">
                <input
                  className="form-control"
                  value={newP.price}
                  onChange={(e) => setNewField("price", e.target.value)}
                  placeholder="499"
                />
              </Field>
            </div>

            <div className="col-md-4">
              <Field label="MRP">
                <input
                  className="form-control"
                  value={newP.mrp}
                  onChange={(e) => setNewField("mrp", e.target.value)}
                  placeholder="799"
                />
              </Field>
            </div>

            <div className="col-md-4">
              <Field label="Stock">
                <input
                  className="form-control"
                  value={newP.stock}
                  onChange={(e) => setNewField("stock", e.target.value)}
                  placeholder="50"
                />
              </Field>
            </div>

            <div className="col-12 d-grid d-sm-block mt-2">
              <button disabled={creating} className="btn btn-primary">
                {creating ? "Creating..." : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* List of All Products */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">Products ({products.length})</h5>
      </div>

      {loading ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body d-flex align-items-center gap-2 text-secondary">
            <div className="spinner-border spinner-border-sm" role="status" />
            <span>Loading products...</span>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h5 className="mb-2">No products available</h5>
            <p className="text-secondary mb-0">
              Create a product to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="d-grid gap-3">
          {products.map((p) => (
            <div key={p._id} className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="row g-3 align-items-center">
                  <div className="col-auto">
                    <img
                      src={
                        p.image || "https://via.placeholder.com/100?text=Img"
                      }
                      alt={p.title}
                      className="rounded-3 admin-product-image"
                    />
                  </div>

                  <div className="col">
                    <div className="fw-bold">{p.title}</div>
                    <div className="small text-secondary">
                      {p.brand ? `${p.brand} - ` : ""}
                      {p.category || "General"} - Stock: {p.stock ?? 0}
                    </div>
                  </div>

                  <div className="col-sm-auto fw-bold">{`\u20B9${p.price}`}</div>

                  <div className="col-sm-auto d-flex gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="btn btn-outline-secondary btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(p._id)}
                      className="btn btn-outline-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Edit section */}
                {editingId === p._id && editP && (
                  <div className="border-top mt-3 pt-3">
                    <h6 className="mb-3">Edit: {p.title}</h6>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <Field label="Title">
                          <input
                            className="form-control"
                            value={editP.title}
                            onChange={(e) =>
                              setEditField("title", e.target.value)
                            }
                          />
                        </Field>
                      </div>

                      <div className="col-md-6">
                        <Field label="Brand">
                          <input
                            className="form-control"
                            value={editP.brand}
                            onChange={(e) =>
                              setEditField("brand", e.target.value)
                            }
                          />
                        </Field>
                      </div>

                      <div className="col-md-6">
                        <Field label="Category">
                          <select
                            className="form-select"
                            value={editP.category}
                            onChange={(e) =>
                              setEditField("category", e.target.value)
                            }
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>

                      <div className="col-md-6">
                        <Field label="Image URL">
                          <input
                            className="form-control"
                            value={editP.image}
                            onChange={(e) =>
                              setEditField("image", e.target.value)
                            }
                          />
                        </Field>
                      </div>

                      <div className="col-12">
                        <Field label="Description">
                          <textarea
                            className="form-control"
                            value={editP.description}
                            onChange={(e) =>
                              setEditField("description", e.target.value)
                            }
                            rows={3}
                          />
                        </Field>
                      </div>

                      <div className="col-md-4">
                        <Field label="Price">
                          <input
                            className="form-control"
                            value={editP.price}
                            onChange={(e) =>
                              setEditField("price", e.target.value)
                            }
                          />
                        </Field>
                      </div>

                      <div className="col-md-4">
                        <Field label="MRP">
                          <input
                            className="form-control"
                            value={editP.mrp}
                            onChange={(e) =>
                              setEditField("mrp", e.target.value)
                            }
                          />
                        </Field>
                      </div>

                      <div className="col-md-4">
                        <Field label="Stock">
                          <input
                            className="form-control"
                            value={editP.stock}
                            onChange={(e) =>
                              setEditField("stock", e.target.value)
                            }
                          />
                        </Field>
                      </div>

                      <div className="col-12 d-flex justify-content-end gap-2 mt-2">
                        <button
                          onClick={cancelEdit}
                          className="btn btn-outline-secondary"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={onSaveEdit}
                          className="btn btn-primary"
                        >
                          Save
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
