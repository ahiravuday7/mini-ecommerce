import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchCategories } from "../api/categories.api";
import { fetchProducts } from "../api/products.api";

// This creates a global container
const CategoriesContext = createContext(null);

let categoriesCache = null; //Stores already fetched categories,Prevents API call again
let categoriesRequest = null; //Stores ongoing API request (Promise),Prevents multiple parallel API calls

// It reads all products -> groups them by category -> collects their subcategories -> returns a clean category list.
const buildCategoriesFromProducts = (products) => {
  const grouped = new Map();

  (Array.isArray(products) ? products : []).forEach((product) => {
    const categoryName = String(product?.category || "").trim();
    if (!categoryName) return;

    if (!grouped.has(categoryName)) {
      grouped.set(categoryName, {
        name: categoryName,
        image: String(product?.image || "").trim(),
        subcategories: [],
      });
    }

    const subcategory = String(product?.subcategory || "").trim();
    if (!subcategory) return;

    const category = grouped.get(categoryName);
    if (!category.subcategories.includes(subcategory)) {
      category.subcategories.push(subcategory);
    }
  });

  return Array.from(grouped.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
};

async function loadCategoriesFromApi(force = false) {
  if (!force && categoriesCache) return categoriesCache; //If already loaded -> return immediately,No API call
  if (!force && categoriesRequest) return categoriesRequest; // If API already in progress -> reuse same Promise,Prevents duplicate calls

  // Calls categories API and caches the latest hierarchy.
  categoriesRequest = fetchCategories()
    .then(async ({ data }) => {
      const categoryList = Array.isArray(data) ? data : [];
      if (categoryList.length > 0) {
        categoriesCache = categoryList;
        return categoriesCache;
      }

      // Fallback for older DBs where categories are not seeded yet.
      const { data: products } = await fetchProducts();
      categoriesCache = buildCategoriesFromProducts(products);
      return categoriesCache;
    })
    //Once request is done -> clear request tracker
    .finally(() => {
      categoriesRequest = null;
    });

  return categoriesRequest;
}

// wraps your app and provides data.
export function CategoriesProvider({ children }) {
  // If cache exists -> use it immediately,Else -> start loading
  const [categories, setCategories] = useState(categoriesCache || []);
  const [loading, setLoading] = useState(!categoriesCache);
  const [error, setError] = useState("");

  // Manual Refresh Function, Forces API call (force = true),Updates categories
  const refreshCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const nextCategories = await loadCategoriesFromApi(true);
      setCategories(nextCategories);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (categoriesCache) return;

      try {
        setLoading(true);
        setError("");
        const nextCategories = await loadCategoriesFromApi();
        if (!cancelled) setCategories(nextCategories);
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.message || "Failed to load categories");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Prevents unnecessary re-renders,Only updates when dependencies change
  const value = useMemo(
    () => ({ categories, loading, error, refreshCategories }),
    [categories, loading, error],
  );

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

// Custom Hook
export function useCategories() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error("useCategories must be used within CategoriesProvider");
  }
  return context;
}

// It fetches categories once, caches them, avoids duplicate API calls, and provides them to the entire app using React Context.
