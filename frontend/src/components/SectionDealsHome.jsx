import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../api/products.api";

const DEAL_LIMIT = 12;
const PLACEHOLDER_COUNT = 8;
const SECTION_DEAL_LIMIT = 4;
const TOP_BRAND_COUNT = 5;

const DEAL_SECTIONS = [
  {
    id: "appliances",
    title: "Hot Deals on Appliances",
    keywords: [
      "appliance",
      "refrigerator",
      "microwave",
      "washing",
      "air conditioner",
      "ac",
      "kitchen",
    ],
  },
  {
    id: "mobiles",
    title: "Hot Deals on Mobiles",
    keywords: [
      "mobile",
      "phone",
      "smartphone",
      "iphone",
      "samsung",
      "galaxy",
      "oneplus",
      "xiaomi",
      "redmi",
    ],
  },
  {
    id: "fashion",
    title: "Hot Deals on Fashion",
    keywords: [
      "fashion",
      "shirt",
      "t-shirt",
      "jeans",
      "dress",
      "jacket",
      "shoe",
      "sneaker",
      "clothing",
      "apparel",
      "kurta",
    ],
  },
];

// Calculate discount per product
const getDiscountPercent = (product) => {
  const mrp = Number(product?.mrp || 0);
  const price = Number(product?.price || 0);
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};

const byDiscountThenRating = (a, b) => {
  const discountDiff = getDiscountPercent(b) - getDiscountPercent(a);
  if (discountDiff !== 0) return discountDiff;
  return Number(b?.rating || 0) - Number(a?.rating || 0);
};

const matchesKeywords = (product, keywords) => {
  const searchable = [
    String(product?.category || ""),
    String(product?.subcategory || ""),
    String(product?.title || ""),
    String(product?.brand || ""),
  ]
    .join(" ")
    .toLowerCase();

  return keywords.some((keyword) => searchable.includes(keyword));
};

const getProductKey = (product) =>
  String(
    product?._id ||
      `${product?.title || "item"}-${product?.brand || ""}-${product?.price || ""}`,
  );

const getProductImage = (image) => {
  const value = String(image || "").trim();
  return value || "/BrokenImage.png";
};

const DealCard = ({ product }) => {
  const discount = getDiscountPercent(product);
  const mrp = Number(product?.mrp || 0);
  const price = Number(product?.price || 0);

  return (
    <div className="card border-0 shadow-sm h-100 deal-card">
      <Link
        to={`/product/${product._id}`}
        className="text-decoration-none text-dark h-100 d-flex flex-column"
      >
        <div className="deal-card-img-wrap bg-light">
          <img
            src={getProductImage(product?.image)}
            alt={product?.title || "Product"}
            className="deal-card-img"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/BrokenImage.png";
            }}
          />
        </div>

        <div className="card-body p-3 d-flex flex-column">
          <h6 className="deal-card-title fw-semibold mb-2">
            {product?.title || "Untitled Product"}
          </h6>

          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="fw-bold">{`\u20B9${price}`}</span>
            {mrp > price && (
              <span className="text-secondary text-decoration-line-through small">
                {`\u20B9${mrp}`}
              </span>
            )}
          </div>

          <div className="small mt-auto">
            {discount > 0 ? (
              <span className="text-success fw-semibold">{`${discount}% off`}</span>
            ) : (
              <span className="text-secondary">Best value</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default function SectionDealsHome() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all products once on mount
  useEffect(() => {
    let cancelled = false;

    const loadDeals = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await fetchProducts();
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.message || "Failed to load deals");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDeals();
    return () => {
      cancelled = true;
    };
  }, []);

  const inStockSortedProducts = useMemo(() => {
    return [...products]
      .filter((p) => Number(p?.stock || 0) > 0)
      .sort(byDiscountThenRating);
  }, [products]);

  const topBrands = useMemo(() => {
    const counts = new Map();

    inStockSortedProducts.forEach((product) => {
      const brand = String(product?.brand || "").trim();
      if (!brand) return;
      counts.set(brand, (counts.get(brand) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, TOP_BRAND_COUNT)
      .map(([name]) => name);
  }, [inStockSortedProducts]);

  const sectionData = useMemo(() => {
    const usedProductKeys = new Set();

    const takeUnique = (predicate, limit) => {
      const picked = [];
      for (const product of inStockSortedProducts) {
        const productKey = getProductKey(product);
        if (usedProductKeys.has(productKey)) continue;
        if (!predicate(product)) continue;
        usedProductKeys.add(productKey);
        picked.push(product);
        if (picked.length >= limit) break;
      }
      return picked;
    };

    const hotDeals = takeUnique(() => true, DEAL_LIMIT);
    const topBrandSet = new Set(topBrands.map((brand) => brand.toLowerCase()));
    const topBrandDeals = takeUnique(
      (p) => topBrandSet.has(String(p?.brand || "").trim().toLowerCase()),
      SECTION_DEAL_LIMIT,
    );
    const categorySections = DEAL_SECTIONS.map((section) => ({
      ...section,
      items: takeUnique(
        (p) => matchesKeywords(p, section.keywords),
        SECTION_DEAL_LIMIT,
      ),
    }));

    return { hotDeals, topBrandDeals, categorySections };
  }, [inStockSortedProducts, topBrands]);

  return (
    <section className="section2 bg-light py-4">
      <div className="container">
        <h4 className="fw-bold mb-3 text-dark">
          Hot Deals For You{" "}
          <i className="bi bi-arrow-right-circle-fill text-primary" />
        </h4>
        {/* Loading skeleton cards */}
        {loading && (
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
            {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
              <div className="col" key={`deal-placeholder-${i}`}>
                <div className="card border-0 shadow-sm h-100 placeholder-glow deal-card">
                  <div className="deal-card-img-wrap placeholder" />
                  <div className="card-body p-3">
                    <span className="placeholder col-10 d-block mb-2" />
                    <span className="placeholder col-6 d-block mb-2" />
                    <span className="placeholder col-4 d-block" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Error alert */}
        {!loading && error && (
          <div className="alert alert-danger mb-0" role="alert">
            {error}
          </div>
        )}
        {/* Empty state if no deals  */}
        {!loading && !error && sectionData.hotDeals.length === 0 && (
          <div className="card border-0 shadow-sm">
            <div className="card-body py-4 text-secondary">
              No deals available right now.
            </div>
          </div>
        )}
        {/* Otherwise renders deal cards */}
        {!loading && !error && sectionData.hotDeals.length > 0 && (
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
            {sectionData.hotDeals.map((product) => (
              <div className="col" key={getProductKey(product)}>
                <DealCard product={product} />
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="mt-4">
            <div className="mb-4">
              <h4 className="fw-bold mb-3 text-dark">
                Hot Deals on Top Brands{" "}
                <i className="bi bi-arrow-right-circle-fill text-primary" />
              </h4>

              {topBrands.length > 0 && (
                <p className="text-secondary small mb-3">
                  {topBrands.join("  |  ")}
                </p>
              )}

              {sectionData.topBrandDeals.length > 0 ? (
                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
                  {sectionData.topBrandDeals.map((product) => (
                    <div className="col" key={`top-brand-${getProductKey(product)}`}>
                      <DealCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card border-0 shadow-sm">
                  <div className="card-body py-3 text-secondary small">
                    No top brand deals available right now.
                  </div>
                </div>
              )}
            </div>

            {sectionData.categorySections.map((section) => (
              <div className="mb-4" key={section.id}>
                <h4 className="fw-bold mb-3 text-dark">
                  {section.title}{" "}
                  <i className="bi bi-arrow-right-circle-fill text-primary" />
                </h4>

                {section.items.length > 0 ? (
                  <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3">
                    {section.items.map((product) => (
                      <div
                        className="col"
                        key={`${section.id}-${getProductKey(product)}`}
                      >
                        <DealCard product={product} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="card border-0 shadow-sm">
                    <div className="card-body py-3 text-secondary small">
                      No deals available right now.
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
