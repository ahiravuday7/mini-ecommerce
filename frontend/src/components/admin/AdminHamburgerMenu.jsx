import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminHamburgerMenu() {
  const menuId = "adminMenuOffcanvas";
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const greeting = user?.name ? `Hello, ${user.name}` : "Hello, Admin";

  const dashboardItems = [{ label: "Dashboard Overview", to: "/admin" }];

  const managementItems = [
    { label: "Products", to: "/admin/products" },
    { label: "Users", to: "/admin/users" },
    { label: "FAQs", to: "/admin/faqs" },
  ];

  const quickItems = [{ label: "Detailed Dashboard", to: "/admin/dashboard" }];

  const handleNavigate = (to) => {
    navigate(to);
  };

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
        aria-label="Open admin menu"
      >
        <i className="bi bi-list fs-5" />
      </button>

      <div
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id={menuId}
        aria-labelledby="adminMenuOffcanvasLabel"
      >
        <div className="offcanvas-header border-bottom sticky-top bg-white">
          <h5 className="offcanvas-title" id="adminMenuOffcanvasLabel">
            <i className="bi bi-shield-lock me-2" />
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
              title="Dashboard"
              items={dashboardItems}
              onNavigate={handleNavigate}
            />
            <hr />
            <Section
              title="Management"
              items={managementItems}
              onNavigate={handleNavigate}
            />
            <hr />
            <Section
              title="Quick Access"
              items={quickItems}
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
                onClick={() => onNavigate(item.to)}
                className={`btn w-100 text-start d-flex align-items-center justify-content-between py-2 text-decoration-none user-menu-link border-0 ${
                  location.pathname === target.pathname && isSearchMatch
                    ? "fw-semibold text-primary"
                    : "text-dark"
                }`}
                data-bs-dismiss="offcanvas"
              >
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
