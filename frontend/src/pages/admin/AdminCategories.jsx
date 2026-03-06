import { useEffect, useMemo, useState } from "react";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "../../api/categories.api";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useCategories } from "../../context/CategoriesContext";

// converts comma-separated text from an input field into a clean array of subcategories.
const parseSubcategories = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

// converts a subcategory array from the database into a comma-separated string for the input field.
const toSubcategoryText = (subcategories) =>
  Array.isArray(subcategories)
    ? subcategories
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .join(", ")
    : "";

export default function AdminCategories() {
  const { refreshCategories } = useCategories();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [creating, setCreating] = useState(false);
  //Create Category form
  const [newCategory, setNewCategory] = useState({
    name: "",
    image: "",
    subcategoriesText: "",
    isActive: true,
  });

  const [editingId, setEditingId] = useState("");
  const [editCategory, setEditCategory] = useState(null);

  // confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmVariant: "danger",
    onConfirm: null,
  });

  //opening the confirmation dialog with dynamic content and action.
  const openConfirmDialog = (config) => {
    setConfirmDialog({
      show: true,
      title: config.title || "Confirm Action",
      message: config.message || "Are you sure?",
      confirmText: config.confirmText || "Confirm",
      confirmVariant: config.confirmVariant || "danger",
      onConfirm: config.onConfirm || null,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, show: false, onConfirm: null }));
  };

  // loading categories from the backend API and updating the UI state.
  const load = async () => {
    try {
      setLoading(true);
      setError("");
      setMsg("");
      const { data } = await fetchCategories({ includeInactive: true });
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  //This runs the load() function when the component first renders.
  useEffect(() => {
    load();
  }, []);

  //Calculate active categories
  const activeCount = useMemo(
    () => categories.filter((category) => category.isActive !== false).length,
    [categories],
  );

  //validate the category data before creating or updating a category.
  const validateCategory = (payload) => {
    if (!payload.name.trim()) return "Category name is required";
    return "";
  };

  //Create Category form submission from start to finish.
  const onCreate = async (e) => {
    e.preventDefault();
    const validationMsg = validateCategory(newCategory);
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    try {
      setCreating(true);
      setError("");
      setMsg("");

      await createCategory({
        name: newCategory.name.trim(),
        image: newCategory.image.trim(),
        subcategories: parseSubcategories(newCategory.subcategoriesText),
        isActive: Boolean(newCategory.isActive),
      });

      setMsg("Category created");
      setNewCategory({
        name: "",
        image: "",
        subcategoriesText: "",
        isActive: true,
      });

      await Promise.all([load(), refreshCategories()]);
    } catch (e2) {
      setError(e2?.response?.data?.message || "Failed to create category");
    } finally {
      setCreating(false);
    }
  };
  // starts the editing mode for a category.
  const startEdit = (category) => {
    setMsg("");
    setError("");
    setEditingId(category._id);
    setEditCategory({
      name: category.name || "",
      image: category.image || "",
      subcategoriesText: toSubcategoryText(category.subcategories),
      isActive: category.isActive !== false,
    });
  };

  //stops editing mode.
  const cancelEdit = () => {
    setEditingId("");
    setEditCategory(null);
  };

  //Save action for editing an existing category.
  const onSaveEdit = async () => {
    if (!editingId || !editCategory) return;

    const validationMsg = validateCategory(editCategory);
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

    try {
      setError("");
      setMsg("");

      await updateCategory(editingId, {
        name: editCategory.name.trim(),
        image: editCategory.image.trim(),
        subcategories: parseSubcategories(editCategory.subcategoriesText),
        isActive: Boolean(editCategory.isActive),
      });

      setMsg("Category updated");
      cancelEdit();

      await Promise.all([load(), refreshCategories()]);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update category");
    }
  };

  //handles the Delete Category workflow
  const onDelete = (id) => {
    openConfirmDialog({
      title: "Delete Category",
      message: "Delete this category? This action cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "danger",
      onConfirm: async () => {
        closeConfirmDialog();
        try {
          setError("");
          setMsg("");
          await deleteCategory(id);
          setMsg("Category deleted");
          await Promise.all([load(), refreshCategories()]);
        } catch (e) {
          setError(e?.response?.data?.message || "Failed to delete category");
        }
      },
    });
  };

  return (
    <div className="py-2">
      <h2 className="mb-1">Admin - Categories</h2>
      <p className="text-secondary mb-3">
        Manage category and subcategory hierarchy.
      </p>
      <p className="small text-secondary mb-4">
        Active categories: {activeCount}/{categories.length}
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
          <h5 className="mb-3">Create Category</h5>
          <form onSubmit={onCreate} className="row g-3">
            <div className="col-md-4">
              <Field label="Category Name">
                <input
                  className="form-control"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Electronics"
                />
              </Field>
            </div>

            <div className="col-md-4">
              <Field label="Image URL">
                <input
                  className="form-control"
                  value={newCategory.image}
                  onChange={(e) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      image: e.target.value,
                    }))
                  }
                  placeholder="/Electronics.png"
                />
              </Field>
            </div>

            <div className="col-md-4">
              <Field label="Status">
                <select
                  className="form-select"
                  value={newCategory.isActive ? "active" : "inactive"}
                  onChange={(e) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      isActive: e.target.value === "active",
                    }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>

            <div className="col-12">
              <Field label="Subcategories (comma separated)">
                <input
                  className="form-control"
                  value={newCategory.subcategoriesText}
                  onChange={(e) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      subcategoriesText: e.target.value,
                    }))
                  }
                  placeholder="Mobile Phones, Laptops, Headphones"
                />
              </Field>
            </div>

            <div className="col-12">
              <button disabled={creating} className="btn btn-primary">
                {creating ? "Creating..." : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body d-flex align-items-center gap-2 text-secondary">
            <div className="spinner-border spinner-border-sm" role="status" />
            <span>Loading categories...</span>
          </div>
        </div>
      ) : categories.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h5 className="mb-2">No categories found</h5>
            <p className="text-secondary mb-0">
              Create your first category to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="d-grid gap-3">
          {categories.map((category) => (
            <div key={category._id} className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                  <div>
                    <h5 className="mb-1">{category.name}</h5>
                    <div className="small text-secondary mb-2">
                      {category.image || "No image"}
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {(Array.isArray(category.subcategories)
                        ? category.subcategories
                        : []
                      ).map((subcategory) => (
                        <span
                          key={`${category._id}-${subcategory}`}
                          className="badge text-bg-light border"
                        >
                          {subcategory}
                        </span>
                      ))}
                      {!category.subcategories?.length && (
                        <span className="small text-secondary">
                          No subcategories
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`badge ${
                        category.isActive !== false
                          ? "text-bg-success"
                          : "text-bg-secondary"
                      }`}
                    >
                      {category.isActive !== false ? "Active" : "Inactive"}
                    </span>

                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => startEdit(category)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => onDelete(category._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {editingId === category._id && editCategory && (
                  <div className="border-top mt-3 pt-3">
                    <h6 className="mb-3">Edit Category</h6>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <Field label="Category Name">
                          <input
                            className="form-control"
                            value={editCategory.name}
                            onChange={(e) =>
                              setEditCategory((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                          />
                        </Field>
                      </div>

                      <div className="col-md-4">
                        <Field label="Image URL">
                          <input
                            className="form-control"
                            value={editCategory.image}
                            onChange={(e) =>
                              setEditCategory((prev) => ({
                                ...prev,
                                image: e.target.value,
                              }))
                            }
                          />
                        </Field>
                      </div>

                      <div className="col-md-4">
                        <Field label="Status">
                          <select
                            className="form-select"
                            value={
                              editCategory.isActive ? "active" : "inactive"
                            }
                            onChange={(e) =>
                              setEditCategory((prev) => ({
                                ...prev,
                                isActive: e.target.value === "active",
                              }))
                            }
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </Field>
                      </div>

                      <div className="col-12">
                        <Field label="Subcategories (comma separated)">
                          <input
                            className="form-control"
                            value={editCategory.subcategoriesText}
                            onChange={(e) =>
                              setEditCategory((prev) => ({
                                ...prev,
                                subcategoriesText: e.target.value,
                              }))
                            }
                          />
                        </Field>
                      </div>

                      <div className="col-12 d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={onSaveEdit}
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

      <ConfirmDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmVariant={confirmDialog.confirmVariant}
        disableConfirm={!confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        onConfirm={() => confirmDialog.onConfirm?.()}
      />
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
