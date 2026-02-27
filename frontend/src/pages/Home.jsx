import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Carousel from "../components/Carousel";
import { fetchProducts } from "../api/products.api";
import "./home.css";

// select manual image for selected categories
const categoryImageMap = {
  Home: "/Home.png",
  Fashion: "/Fashion.png",
  Electronics: "/Electronics.png",
  Accessories: "/Accessories.png",
  Books: "Books.png",
  Sports: "/Sports.png",
};

// for redirect category clicked
const getCategoryImage = (name, fallback) =>
  categoryImageMap[name] || fallback || "/categories/default.png";

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await fetchProducts();
        const deduped = new Map();

        // Loop over products and extract unique categories
        (data || []).forEach((product) => {
          // ensures that if data is null/undefined, still loop over an empty array safely.
          // convert “many products” -> “unique category list”.
          const categoryName = (product?.category || "").trim();
          if (!categoryName) return;

          const key = categoryName.toLowerCase();
          // ensures you only store the first time you see a category.
          if (!deduped.has(key)) {
            // stores: name: original category text (as it appeared first),image: product image (used as fallback later)
            deduped.set(key, {
              name: categoryName,
              image: product?.image || "",
            });
          }
        });

        // Convert Map values to array and set state ,deduped.values() gives only the stored {name, image} objects.
        setCategories(Array.from(deduped.values()));
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleCategoryClick = (categoryName) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}`);
  };

  // render 8 placeholder cards(skeleton cards to show) while loading === true.
  const placeholderCount = 8;

  return (
    <>
      <Carousel />

      {/* bg-body-tertiary:transparent */}
      <section className="bg-body-tertiary">
        <div className="container-fluid py-4">
          {error && (
            <div className="alert alert-danger mx-3 mb-3" role="alert">
              {error}
            </div>
          )}

          <div className="d-flex gap-4 overflow-auto px-3 pb-2 flex-nowrap home-scrollbar-hide ">
            {/* If loading === true -> show skeleton (placeholder UI),If loading === false -> show real category cards */}
            {loading
              ? Array.from({ length: placeholderCount }).map((_, i) => (
                  <div
                    key={`placeholder-${i}`}
                    className="card placeholder-glow flex-shrink-0"
                    style={{ width: 125, height: 158 }}
                  >
                    <div
                      className="card-img-top placeholder"
                      style={{ height: 100 }}
                    ></div>

                    <div
                      className="card-body"
                      style={{ height: 58, padding: 5 }}
                    >
                      <span className="placeholder col-8"></span>
                    </div>
                  </div>
                ))
              : // Loading = FALSE -> Real Data
                categories.map((category) => {
                  const imageSrc = getCategoryImage(
                    category.name,
                    category.image,
                  );
                  return (
                    <div
                      key={category.name}
                      className="card flex-shrink-0 text-center shadow-sm"
                      style={{ width: 125, height: 158, cursor: "pointer" }}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleCategoryClick(category.name)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleCategoryClick(category.name);
                        }
                      }}
                    >
                      <div
                        className="card-img-top d-flex align-items-center justify-content-center p-2 "
                        style={{ height: 100 }}
                      >
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={category.name}
                            className="img-fluid"
                            style={{ maxHeight: "100%", objectFit: "contain" }}
                          />
                        ) : (
                          <span className="text-secondary small">No image</span>
                        )}
                      </div>

                      <div
                        className="card-body d-flex align-items-center justify-content-center"
                        style={{ height: 58, padding: 5 }}
                      >
                        <span className="fw-semibold">{category.name}</span>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </section>
    </>
  );
}
