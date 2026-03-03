import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AdminHamburgerMenu() {
  const menuId = "adminMenuOffcanvas";
  const location = useLocation();
  const navigate = useNavigate();
  const offcanvasRef = useRef(null);

  const links = [
    { label: "Dashboard", to: "/admin" },
    { label: "Products", to: "/admin/products" },
    { label: "FAQs", to: "/admin/faqs" },
  ];

  const hideMenu = () => {
    const Offcanvas = window.bootstrap?.Offcanvas;
    if (!Offcanvas || !offcanvasRef.current) return;
    Offcanvas.getOrCreateInstance(offcanvasRef.current).hide();
  };

  const handleNavigate = (to) => {
    hideMenu();
    navigate(to);
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
        ref={offcanvasRef}
        className="offcanvas offcanvas-end"
        tabIndex="-1"
        id={menuId}
        aria-labelledby="adminMenuOffcanvasLabel"
      >
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title" id="adminMenuOffcanvasLabel">
            Admin Menu
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body p-0">
          <ul className="list-group list-group-flush">
            {links.map((item) => (
              <li className="list-group-item" key={item.to}>
                <button
                  type="button"
                  onClick={() => handleNavigate(item.to)}
                  className={`text-decoration-none d-flex align-items-center justify-content-between ${
                    location.pathname === item.to
                      ? "fw-semibold text-primary"
                      : "text-dark"
                  } border-0 bg-transparent w-100 text-start`}
                >
                  <span>{item.label}</span>
                  <i className="bi bi-chevron-right small text-muted" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
