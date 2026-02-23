import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from "../api/products.api";

const card = {
  border: "1px solid #eee",
  borderRadius: 14,
  background: "white",
  padding: 14,
};

const inputStyle = {
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 10,
  width: "100%",
  outline: "none",
};

const btn = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
  fontWeight: 800,
};

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
    return ["General", ...Array.from(set).filter((x) => x !== "General")]; // "General" always appears first, No duplicate "General" , Convert Set → Array
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

  // “Run load() only once when component mounts”
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
      setCreating(true); // disables button / shows “Creating…”
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
      setMsg("Product created ✅");
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
      setMsg("Product updated ✅");
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
      setMsg("Product deleted ✅");
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delete product");
    }
  };

  return (
    <div>
      <h2 style={{ margin: "6px 0 2px" }}>Admin — Products</h2>
      <div style={{ color: "#666", fontSize: 14 }}>
        Create, update and delete products.
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            background: "#fff3f3",
            border: "1px solid #ffd0d0",
            padding: 12,
            borderRadius: 12,
            color: "#a40000",
          }}
        >
          {error}
        </div>
      )}

      {msg && (
        <div
          style={{
            marginTop: 12,
            background: "#f1fff3",
            border: "1px solid #bff0c4",
            padding: 12,
            borderRadius: 12,
            color: "#1b5e20",
          }}
        >
          {msg}
        </div>
      )}

      {/* Create */}
      <div style={{ ...card, marginTop: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Create Product</div>

        <form onSubmit={onCreate} style={{ display: "grid", gap: 12 }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Title">
              <input
                style={inputStyle}
                value={newP.title}
                onChange={(e) => setNewField("title", e.target.value)}
                placeholder="Wireless Mouse"
              />
            </Field>

            <Field label="Brand">
              <input
                style={inputStyle}
                value={newP.brand}
                onChange={(e) => setNewField("brand", e.target.value)}
                placeholder="ClickPro"
              />
            </Field>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Category">
              <select
                style={inputStyle}
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

            <Field label="Image URL">
              <input
                style={inputStyle}
                value={newP.image}
                onChange={(e) => setNewField("image", e.target.value)}
                placeholder="https://..."
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              style={{ ...inputStyle, minHeight: 90 }}
              value={newP.description}
              onChange={(e) => setNewField("description", e.target.value)}
              placeholder="Short product description..."
              maxLength={500}
            />
            <div style={{ fontSize: 12, color: "#888", textAlign: "right" }}>
              {newP.description.length}/500
            </div>
          </Field>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            <Field label="Price">
              <input
                style={inputStyle}
                value={newP.price}
                onChange={(e) => setNewField("price", e.target.value)}
                placeholder="499"
              />
            </Field>

            <Field label="MRP">
              <input
                style={inputStyle}
                value={newP.mrp}
                onChange={(e) => setNewField("mrp", e.target.value)}
                placeholder="799"
              />
            </Field>

            <Field label="Stock">
              <input
                style={inputStyle}
                value={newP.stock}
                onChange={(e) => setNewField("stock", e.target.value)}
                placeholder="50"
              />
            </Field>
          </div>

          <button disabled={creating} style={{ ...btn, border: "none" }}>
            {creating ? "Creating..." : "Create Product"}
          </button>
        </form>
      </div>

      {/* List of All Products */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>
          Products ({products.length})
        </div>

        {loading ? (
          <div>Loading products...</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {products.map((p) => (
              <div key={p._id} style={{ ...card, padding: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <img
                    src={p.image || "https://via.placeholder.com/100?text=Img"}
                    alt={p.title}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      objectFit: "cover",
                      background: "#fafafa",
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900 }}>{p.title}</div>
                    <div style={{ fontSize: 13, color: "#666" }}>
                      {p.brand ? `${p.brand} • ` : ""}
                      {p.category || "General"} • Stock: {p.stock ?? 0}
                    </div>
                  </div>

                  <div style={{ fontWeight: 900 }}>₹{p.price}</div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => startEdit(p)} style={btn}>
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(p._id)}
                      style={{
                        ...btn,
                        borderColor: "#f2c9c9",
                        color: "#a40000",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Edit section */}
                {editingId === p._id && editP && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px solid #eee",
                    }}
                  >
                    <div style={{ fontWeight: 900, marginBottom: 10 }}>
                      Edit: {p.title}
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                        }}
                      >
                        <Field label="Title">
                          <input
                            style={inputStyle}
                            value={editP.title}
                            onChange={(e) =>
                              setEditField("title", e.target.value)
                            }
                          />
                        </Field>

                        <Field label="Brand">
                          <input
                            style={inputStyle}
                            value={editP.brand}
                            onChange={(e) =>
                              setEditField("brand", e.target.value)
                            }
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
                        <Field label="Category">
                          <select
                            style={inputStyle}
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

                        <Field label="Image URL">
                          <input
                            style={inputStyle}
                            value={editP.image}
                            onChange={(e) =>
                              setEditField("image", e.target.value)
                            }
                          />
                        </Field>
                      </div>

                      <Field label="Description">
                        <textarea
                          style={{ ...inputStyle, minHeight: 90 }}
                          value={editP.description}
                          onChange={(e) =>
                            setEditField("description", e.target.value)
                          }
                        />
                      </Field>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 12,
                        }}
                      >
                        <Field label="Price">
                          <input
                            style={inputStyle}
                            value={editP.price}
                            onChange={(e) =>
                              setEditField("price", e.target.value)
                            }
                          />
                        </Field>

                        <Field label="MRP">
                          <input
                            style={inputStyle}
                            value={editP.mrp}
                            onChange={(e) =>
                              setEditField("mrp", e.target.value)
                            }
                          />
                        </Field>

                        <Field label="Stock">
                          <input
                            style={inputStyle}
                            value={editP.stock}
                            onChange={(e) =>
                              setEditField("stock", e.target.value)
                            }
                          />
                        </Field>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          justifyContent: "flex-end",
                        }}
                      >
                        <button onClick={cancelEdit} style={btn}>
                          Cancel
                        </button>
                        <button
                          onClick={onSaveEdit}
                          style={{ ...btn, border: "none" }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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
