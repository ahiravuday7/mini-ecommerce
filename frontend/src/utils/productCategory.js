export const getProductCategoryLabel = (product, fallback = "General") => {
  const category = String(product?.category || "").trim();
  const subcategory = String(product?.subcategory || "").trim();

  if (category && subcategory) return `${category} > ${subcategory}`;
  if (category) return category;
  if (subcategory) return subcategory;
  return fallback;
};

// productCategory.js formats a product’s category text for display.
// If product has both category and subcategory -> returns "Category > Subcategory"
// If only category exists -> returns category
// If only subcategory exists -> returns subcategory
// If neither exists -> returns fallback ("General")
// Used in UI (card/details/cart/admin dashboard) to show consistent category labels.
