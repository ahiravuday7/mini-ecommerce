// exporting a utility function.It takes products array as input.
export function extractCategories(products) {
  const deduped = new Map(); //Map is used to store unique categories.

  // If products is a valid array -> use it,Else -> use empty array []
  (Array.isArray(products) ? products : []).forEach((product) => {
    //avoids crash if product is undefined, fallback to empty string, removes extra spaces
    const categoryName = (product?.category || "").trim();
    // If category is empty -> skip this product
    if (!categoryName) return;

    // Create case-insensitive key to Avoid duplicate categories with different casing
    const key = categoryName.toLowerCase();
    // If category not already stored -> add it
    if (!deduped.has(key)) {
      deduped.set(key, {
        name: categoryName,
        image: product?.image || "",
      });
    }
  });

  // Convert Map -> Array
  return Array.from(deduped.values());
}
