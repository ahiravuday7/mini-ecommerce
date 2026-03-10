import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from "../../api/products.api";
import ConfirmDialog from "../../components/ConfirmDialog";
import Pagination from "../../components/Pagination";
import { useCategories } from "../../context/CategoriesContext";
import { getProductCategoryLabel } from "../../utils/productCategory";

const PRODUCTS_PER_PAGE = 10;

// Empty string ("") means “no filter applied” for that field.
const emptyFilters = {
  brand: "",
  category: "",
  subcategory: "",
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

// for product tag
const parseTags = (value) =>
  String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const toTagsText = (tags) =>
  Array.isArray(tags)
    ? tags
        .map((tag) => String(tag || "").trim())
        .filter(Boolean)
        .join(", ")
    : "";

export default function AdminProducts() {
  const { categories: categoryTree } = useCategories();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); //// When page loads -> starts from page 1

  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(emptyFilters);
  const [searchText, setSearchText] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmVariant: "danger",
    onConfirm: null,
  });

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

  // Create form
  const [creating, setCreating] = useState(false);
  const [newP, setNewP] = useState({
    title: "",
    brand: "",
    category: "",
    subcategory: "",
    description: "",
    tagsText: "",
    price: "",
    mrp: "",
    stock: "",
    image: "",
  });

  // Edit form
  const [editingId, setEditingId] = useState("");
  const [editP, setEditP] = useState(null);

  //This allows fast lookup of subcategories by category.
  const subcategoriesByCategory = useMemo(() => {
    const map = new Map();

    //Safe iteration over categoryTree ,This checks if categoryTree is actually an array.If yes -> use it,If not -> use empty array
    (Array.isArray(categoryTree) ? categoryTree : []).forEach((category) => {
      const categoryName = String(category?.name || "").trim();
      if (!categoryName) return;

      // Ensure subcategories is an array
      const subcategories = (
        Array.isArray(category?.subcategories) ? category.subcategories : []
      )
        .map((sub) => String(sub || "").trim())
        .filter(Boolean);

      //Store result in Map
      map.set(categoryName, subcategories);
    });

    return map;
  }, [categoryTree]); //The Map will only rebuild when categoryTree changes.

  // For a selected category, it returns all subcategories from:configured category tree,plus any subcategories already present in product data
  const getSubcategoriesByCategory = useCallback(
    //collect all unique subcategories for a given category.
    (category, productList = []) => {
      const deduped = new Set(subcategoriesByCategory.get(category) || []);

      // adds additional subcategories from products and removes duplicates before returning the final list.
      productList.forEach((product) => {
        const productCategory = String(product?.category || "").trim();
        const subcategory = String(product?.subcategory || "").trim();
        if (!subcategory || productCategory !== category) return;
        deduped.add(subcategory); //deduped is a Set, so duplicates are automatically removed.
      });

      return Array.from(deduped); //Convert Set -> Array
    },
    [subcategoriesByCategory], //This means the function will only re-create when the category configuration map changes.
  );

  // first takes configured categories from context,then adds any extra categories discovered in products
  const configuredCategories = useMemo(
    () =>
      Array.from(subcategoriesByCategory.keys()).sort((a, b) =>
        a.localeCompare(b),
      ),
    [subcategoriesByCategory],
  );

  // categories used in your AdminProducts UI by combining:Configured categories (from your category configuration / context),Categories discovered from products in the database
  const categories = useMemo(() => {
    const discovered = new Set();

    products.forEach((product) => {
      const category = String(product?.category || "").trim();
      if (category) discovered.add(category);
    });

    const extraCategories = Array.from(discovered)
      .filter((category) => !subcategoriesByCategory.has(category))
      .sort((a, b) => a.localeCompare(b));

    return [...configuredCategories, ...extraCategories];
  }, [products, configuredCategories, subcategoriesByCategory]);

  //Extract all unique brands from products and use them in filter dropdown
  const filterBrands = useMemo(() => {
    const set = new Set(
      products.map((p) => (p.brand || "").trim()).filter(Boolean),
    );
    return ["", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  //Extract all categories from products and use them in filter dropdown
  const filterCategories = useMemo(() => {
    return ["", ...categories];
  }, [categories]);

  // list of subcategories used in the filter dropdown, depending on whether a category filter is selected or not. It also removes duplicates and sorts them.
  const filterSubcategories = useMemo(() => {
    const deduped = new Set();

    if (filters.category) {
      getSubcategoriesByCategory(filters.category, products).forEach((sub) =>
        deduped.add(sub),
      );
    } else {
      subcategoriesByCategory.forEach((subcategoryList) => {
        subcategoryList.forEach((subcategory) => deduped.add(subcategory));
      });

      products.forEach((product) => {
        const subcategory = String(product?.subcategory || "").trim();
        if (subcategory) deduped.add(subcategory);
      });
    }

    return ["", ...Array.from(deduped).sort((a, b) => a.localeCompare(b))];
  }, [
    products,
    filters.category,
    subcategoriesByCategory,
    getSubcategoriesByCategory,
  ]);

  // New create/edit subcategory option lists
  const createSubcategories = useMemo(
    () => getSubcategoriesByCategory(newP.category, products),
    [newP.category, products, getSubcategoriesByCategory],
  );

  const editSubcategories = useMemo(
    () => getSubcategoriesByCategory(editP?.category || "", products),
    [editP?.category, products, getSubcategoriesByCategory],
  );

  const filteredProducts = useMemo(() => {
    // Convert into number (or null)
    const minPrice = filters.minPrice === "" ? null : Number(filters.minPrice);
    const maxPrice = filters.maxPrice === "" ? null : Number(filters.maxPrice);
    const minDiscount =
      filters.minDiscount === "" ? null : Number(filters.minDiscount);
    const minRating =
      filters.minRating === "" ? null : Number(filters.minRating);

    const q = searchText.trim().toLowerCase();

    // For each product p, you normalize values:
    const result = products.filter((p) => {
      const brand = (p.brand || "").trim();
      const category = (p.category || "").trim();
      const subcategory = (p.subcategory || "").trim();
      const price = Number(p.price || 0);
      const rating = Number(p.rating || 0);
      const discount = getDiscountPercent(p);
      const title = String(p.title || "").toLowerCase();
      const brandLower = brand.toLowerCase();
      const categoryLower = category.toLowerCase();
      const subcategoryLower = subcategory.toLowerCase();
      const description = String(p.description || "").toLowerCase();
      const tagsLower = Array.isArray(p.tags)
        ? p.tags.join(" ").toLowerCase()
        : "";

      if (
        q &&
        !title.includes(q) &&
        !brandLower.includes(q) &&
        !categoryLower.includes(q) &&
        !subcategoryLower.includes(q) &&
        !description.includes(q) &&
        !tagsLower.includes(q)
      ) {
        return false;
      }

      if (filters.brand && brand !== filters.brand) return false;
      if (filters.category && category !== filters.category) return false;
      if (filters.subcategory && subcategory !== filters.subcategory)
        return false;
      if (minPrice !== null && price < minPrice) return false;
      if (maxPrice !== null && price > maxPrice) return false;
      if (minDiscount !== null && discount < minDiscount) return false;
      if (minRating !== null && rating < minRating) return false;

      return true;
    });

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
  }, [products, filters, searchText]);

  // calculates how many total pages need
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)), //Ensures minimum 1 page,Always round UP,
    [filteredProducts.length],
  );

  // It selects only the products for the current page
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

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

  // keep page in valid range if results become fewer(current page never exceeds total pages)
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchText]);

  // This useEffect automatically sets a default category and subcategory in the Create Product form when the current category is missing or invalid.
  useEffect(() => {
    if (categories.length === 0) return;

    const categoryMissing =
      !newP.category || !categories.includes(newP.category);
    if (!categoryMissing) return;

    const defaultCategory = categories[0];
    const deduped = new Set(subcategoriesByCategory.get(defaultCategory) || []);

    products.forEach((product) => {
      const productCategory = String(product?.category || "").trim();
      const subcategory = String(product?.subcategory || "").trim();
      if (!subcategory || productCategory !== defaultCategory) return;
      deduped.add(subcategory);
    });

    const defaultSubcategory = Array.from(deduped)[0] || "";

    setNewP((prev) => ({
      ...prev,
      category: defaultCategory,
      subcategory: defaultSubcategory,
    }));
  }, [categories, newP.category, products, subcategoriesByCategory]);

  // It uses a functional state update and computed property names to update a single field without mutating or overwriting the existing state.
  const setNewField = (k, v) => setNewP((p) => ({ ...p, [k]: v }));

  // Validate new product form, It checks whether the required fields are filled correctly and returns an error message if something is wrong.
  const validateNew = () => {
    if (!newP.title.trim()) return "Title is required";
    if (!newP.category.trim()) return "Category is required";
    if (newP.price === "" || Number(newP.price) < 0)
      return "Valid price is required";

    const subcategories = getSubcategoriesByCategory(newP.category, products);
    if (subcategories.length > 0 && !newP.subcategory.trim()) {
      return "Subcategory is required for selected category";
    }

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
        category: newP.category.trim(),
        subcategory: newP.subcategory.trim(),
        tags: parseTags(newP.tagsText),
        price: Number(newP.price),
        // converts price/mrp/stock to numbers, defaults empty mrp/stock to 0
        mrp: newP.mrp === "" ? 0 : Number(newP.mrp),
        stock: newP.stock === "" ? 0 : Number(newP.stock),
      };

      // API call
      await createProduct(payload);
      setMsg("Product created");
      const defaultCategory = categories[0] || "";
      const defaultSubcategory =
        getSubcategoriesByCategory(defaultCategory, products)[0] || "";

      setNewP({
        title: "",
        brand: "",
        category: defaultCategory,
        subcategory: defaultSubcategory,
        description: "",
        tagsText: "",
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
      category: p.category || categories[0] || "",
      subcategory: p.subcategory || "",
      description: p.description || "",
      tagsText: toTagsText(p.tags),
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

    //if the selected category has subcategories, the user must select one before saving.
    const editSubcategoryOptions = getSubcategoriesByCategory(
      editP.category,
      products,
    );
    if (editSubcategoryOptions.length > 0 && !editP.subcategory.trim()) {
      return setError("Subcategory is required for selected category");
    }

    try {
      setError("");
      setMsg("");
      const payload = {
        ...editP,
        title: editP.title.trim(),
        category: editP.category.trim(),
        subcategory: editP.subcategory.trim(),
        tags: parseTags(editP.tagsText),
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
  const onDelete = (id) => {
    openConfirmDialog({
      title: "Delete Product",
      message: "Delete this product?",
      confirmText: "Delete",
      confirmVariant: "danger",
      onConfirm: async () => {
        closeConfirmDialog();

        try {
          setError("");
          setMsg("");
          await deleteProduct(id);
          setMsg("Product deleted");
          await load();
        } catch (e) {
          setError(e?.response?.data?.message || "Failed to delete product");
        }
      },
    });
  };

  // updates your filter state dynamically and also resets the subcategory filter when the category filter changes.
  const setFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "category") next.subcategory = "";
      return next;
    });
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setSearchText("");
  };

  return (
    <div className="py-2">
      <h2 className="mb-1">Admin - Products</h2>
      <p className="text-secondary">Create, update and delete products.</p>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div className="flex-grow-1" style={{ maxWidth: 460 }}>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-white">
              <i className="bi bi-search" />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by title, brand, category, subcategory, description, tags..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
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

        <button
          type="button"
          className={`btn btn-sm ${showCreateForm ? "btn-outline-secondary" : "btn-primary"}`}
          onClick={() => setShowCreateForm((v) => !v)}
        >
          {showCreateForm ? "Close Create Form" : "+ Add New Product"}
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
                  {filterBrands.map((b) => (
                    <option key={b || "all-brands"} value={b}>
                      {b || "All Brands"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={filters.category}
                  onChange={(e) => setFilter("category", e.target.value)}
                >
                  {filterCategories.map((c) => (
                    <option key={c || "all-categories"} value={c}>
                      {c || "All Categories"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Subcategory</label>
                <select
                  className="form-select"
                  value={filters.subcategory}
                  onChange={(e) => setFilter("subcategory", e.target.value)}
                >
                  {filterSubcategories.map((subcategory) => (
                    <option
                      key={subcategory || "all-subcategories"}
                      value={subcategory}
                    >
                      {subcategory || "All Subcategories"}
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
      {showCreateForm && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0">Create Product</h5>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            </div>

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

              <div className="col-md-4">
                <Field label="Category">
                  <select
                    className="form-select"
                    value={newP.category}
                    onChange={(e) => {
                      const nextCategory = e.target.value;
                      const nextSubcategories = getSubcategoriesByCategory(
                        nextCategory,
                        products,
                      );
                      setNewP((prev) => ({
                        ...prev,
                        category: nextCategory,
                        subcategory: nextSubcategories[0] || "",
                      }));
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="col-md-4">
                <Field label="Subcategory">
                  <select
                    className="form-select"
                    value={newP.subcategory}
                    onChange={(e) => setNewField("subcategory", e.target.value)}
                  >
                    <option value="">Select subcategory</option>
                    {createSubcategories.map((subcategory) => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="col-md-4">
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

              <div className="col-12">
                <Field label="Tags (comma separated)">
                  <input
                    className="form-control"
                    value={newP.tagsText}
                    onChange={(e) => setNewField("tagsText", e.target.value)}
                    placeholder="wireless, gaming, rgb"
                  />
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
      )}

      {/* List of All Products */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">
          Products ({filteredProducts.length}/{products.length})
        </h5>
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
      ) : filteredProducts.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h5 className="mb-2">No products match this search/filter</h5>
            <p className="text-secondary mb-0">
              Try adjusting search text or filter combination.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="d-grid gap-3">
            {paginatedProducts.map((p) => (
              <div key={p._id} className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="row g-3 align-items-center">
                    <div className="col-auto">
                      <img
                        src={p.image || "/BrokenImage.png"}
                        alt={p.title}
                        className="rounded-3 admin-product-image"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/BrokenImage.png";
                        }}
                      />
                    </div>

                    <div className="col">
                      <div className="fw-bold">{p.title}</div>
                      <div className="small text-secondary">
                        {p.brand ? `${p.brand} - ` : ""}
                        {getProductCategoryLabel(p)} - Stock: {p.stock ?? 0}
                      </div>
                      {Array.isArray(p.tags) && p.tags.length > 0 && (
                        <div className="small text-secondary">
                          Tags: {p.tags.join(", ")}
                        </div>
                      )}
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

                        <div className="col-md-4">
                          <Field label="Category">
                            <select
                              className="form-select"
                              value={editP.category}
                              onChange={(e) => {
                                const nextCategory = e.target.value;
                                const nextSubcategories =
                                  getSubcategoriesByCategory(
                                    nextCategory,
                                    products,
                                  );

                                setEditP((prev) => ({
                                  ...prev,
                                  category: nextCategory,
                                  subcategory: nextSubcategories.includes(
                                    prev.subcategory,
                                  )
                                    ? prev.subcategory
                                    : nextSubcategories[0] || "",
                                }));
                              }}
                            >
                              {categories.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </Field>
                        </div>

                        <div className="col-md-4">
                          <Field label="Subcategory">
                            <select
                              className="form-select"
                              value={editP.subcategory}
                              onChange={(e) =>
                                setEditField("subcategory", e.target.value)
                              }
                            >
                              <option value="">Select subcategory</option>
                              {editSubcategories.map((subcategory) => (
                                <option key={subcategory} value={subcategory}>
                                  {subcategory}
                                </option>
                              ))}
                            </select>
                          </Field>
                        </div>

                        <div className="col-md-4">
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

                        <div className="col-12">
                          <Field label="Tags (comma separated)">
                            <input
                              className="form-control"
                              value={editP.tagsText}
                              onChange={(e) =>
                                setEditField("tagsText", e.target.value)
                              }
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

          <div className="d-flex justify-content-center mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
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
