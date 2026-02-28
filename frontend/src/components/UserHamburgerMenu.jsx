import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCategories } from "../context/CategoriesContext";
import { useAuth } from "../context/AuthContext";

export default function UserHamburgerMenu() {
  const menuId = "userMenuOffcanvas";
  const navigate = useNavigate();
  const { categories, loading } = useCategories();
  const { user, logout } = useAuth();

  // Greeting text based on login
  const greeting = user?.name ? `Hello, ${user.name}` : "Hello, sign in";

  const trendingItems = [
    { label: "Bestsellers", to: "/products?sort=bestsellers" },
    { label: "New Releases", to: "/products?sort=new-releases" },
  ];

  // Converting categories into menu items & where to navigate on click
  const shopByCategoryItems = categories.map((category) => ({
    label: category.name,
    to: `/products?category=${encodeURIComponent(category.name)}`,
  }));
  const helpAndSettingsItems = [
    { label: "Your Account", to: "/orders" },
    { label: "Customer Service", to: "/contact" },
    { label: "Sign in", to: "/login" },
  ];

  const handleNavigate = (to) => {
    navigate(to);
  };

  // run logout() (your auth context cleans session),redirect to /login
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        data-bs-toggle="offcanvas"
        data-bs-target={`#${menuId}`}
        aria-controls={menuId}
        aria-label="Open menu"
      >
        <i className="bi bi-list fs-5" />
      </button>

      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id={menuId}
        aria-labelledby="userMenuOffcanvasLabel"
      >
        <div className="offcanvas-header border-bottom sticky-top bg-white">
          <h5 className="offcanvas-title" id="userMenuOffcanvasLabel">
            <i className="bi bi-person-circle me-2" />
            {greeting}
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>

        <div className="offcanvas-body p-0">
          <div className="p-3 user-menu-scroll">
            <Section
              title="Trending"
              items={trendingItems}
              onNavigate={handleNavigate}
            />
            <hr />
            <Section
              title="Shop by Category"
              items={shopByCategoryItems}
              emptyText={
                loading ? "Loading categories..." : "No categories found"
              }
              onNavigate={handleNavigate}
            />
            <hr />
            <Section
              title="Help & Settings"
              items={helpAndSettingsItems}
              onNavigate={handleNavigate}
            />
          </div>
        </div>

        <div className="border-top p-3 bg-white sticky-bottom">
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-outline-secondary w-100 fw-semibold"
              data-bs-dismiss="offcanvas"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="btn btn-warning w-100 fw-semibold"
              data-bs-dismiss="offcanvas"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, items, emptyText = "No items found", onNavigate }) {
  const location = useLocation();

  // title -> section heading,items -> array of menu items

  return (
    <section className="mb-3">
      <h6 className="fw-bold mb-3">{title}</h6>
      {items.length === 0 && (
        <p className="text-secondary small mb-0">{emptyText}</p>
      )}
      <ul className="list-unstyled mb-0">
        {items.map((item) => {
          const target = new URL(item.to, "http://localhost");
          const isSearchMatch = target.search
            ? location.search === target.search
            : true;

          return (
            <li key={item.label}>
              <button
                type="button"
                // Calls handleNavigate, Navigates to that route
                onClick={() => onNavigate(item.to)}
                className={`btn w-100 text-start d-flex align-items-center justify-content-between py-2 text-decoration-none user-menu-link border-0 ${
                  location.pathname === target.pathname && isSearchMatch
                    ? "fw-semibold text-primary"
                    : "text-dark"
                }`}
                data-bs-dismiss="offcanvas"
              >
                {/* UI Layout , Label (left) ,Arrow icon (right) */}
                <span>{item.label}</span>
                <i className="bi bi-chevron-right small text-muted" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
