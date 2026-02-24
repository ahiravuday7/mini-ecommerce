import { Link } from "react-router-dom";

export default function ProductCard({ p }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <Link
        to={`/product/${p._id}`}
        className="text-decoration-none text-dark h-100"
      >
        <div className="card-img-top bg-light d-flex align-items-center justify-content-center p-3 product-image-wrap">
          <img
            src={p.image || "https://via.placeholder.com/600x400?text=No+Image"}
            alt={p.title}
            className="product-image"
            loading="lazy"
          />
        </div>

        <div className="card-body d-flex flex-column">
          <h5 className="card-title h6 fw-bold mb-2">{p.title}</h5>

          <p className="text-secondary small mb-2">
            {p.brand ? `${p.brand} - ` : ""}
            {p.category || "General"}
          </p>

          <div className="d-flex align-items-baseline gap-2 mb-2">
            <span className="fw-bold fs-5">{`\u20B9${p.price}`}</span>
            {p.mrp > p.price && (
              <span className="text-secondary text-decoration-line-through small">
                {`\u20B9${p.mrp}`}
              </span>
            )}
          </div>

          <div
            className={`small mt-auto ${p.stock > 0 ? "text-success" : "text-danger"}`}
          >
            {p.stock > 0 ? `In stock (${p.stock})` : "Out of stock"}
          </div>
        </div>
      </Link>
    </div>
  );
}
