import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UserHamburgerMenu from "./user/UserHamburgerMenu";
import AdminHamburgerMenu from "./admin/AdminHamburgerMenu";
import UserProductSearchBar from "./user/UserProductSearchBar";

const linkClass = ({ isActive }) =>
  `nav-link px-0 px-lg-2 ${isActive ? "fw-bold text-primary" : "text-secondary"}`;

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isUserOnly = user && !user.isAdmin;
  const isShopperView = !user || !user.isAdmin;
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";
  const brandPath = user?.isAdmin ? "/admin" : "/";
  const [showManagementMenu, setShowManagementMenu] = useState(false);
  const managementMenuRef = useRef(null);

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!managementMenuRef.current?.contains(event.target)) {
        setShowManagementMenu(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setShowManagementMenu(false);
  }, [location.pathname, location.search]);

  return (
    <header className="bg-white border-bottom sticky-top shadow-sm">
      <div className="container py-3">
        <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3">
          <Link
            to={brandPath}
            className="text-decoration-none fs-4 fw-bold text-dark"
          >
            MiniStore
          </Link>

          {isShopperView && !isAuthPage && <UserProductSearchBar />}

          <nav className="nav gap-3 flex-grow-1">
            {isShopperView && (
              <>
                <NavLink to="/" className={linkClass}>
                  Home
                </NavLink>
                {isUserOnly && (
                  <>
                    <NavLink to="/cart" className={linkClass}>
                      Cart
                    </NavLink>
                    <NavLink to="/orders" className={linkClass}>
                      My Orders
                    </NavLink>
                  </>
                )}
              </>
            )}
          </nav>

          <nav className="d-flex align-items-center gap-2 flex-wrap">
            {user ? (
              <>
                <span className="small text-secondary">
                  Hi, <b>{user.name}</b>
                </span>

                {user.isAdmin && (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className="btn btn-outline-primary btn-sm"
                    >
                      Dashboard
                    </Link>
                    <div className="position-relative" ref={managementMenuRef}>
                      <button
                        className="btn btn-outline-primary btn-sm dropdown-toggle"
                        type="button"
                        aria-expanded={showManagementMenu}
                        onClick={() => setShowManagementMenu((v) => !v)}
                      >
                        Management
                      </button>
                      {showManagementMenu && (
                        <ul
                          className="dropdown-menu dropdown-menu-end show"
                          style={{ display: "block" }}
                        >
                          <li>
                            <Link
                              className="dropdown-item"
                              to="/admin/products"
                              onClick={() => setShowManagementMenu(false)}
                            >
                              Products
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item"
                              to="/admin/categories"
                              onClick={() => setShowManagementMenu(false)}
                            >
                              Categories
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item"
                              to="/admin/users"
                              onClick={() => setShowManagementMenu(false)}
                            >
                              Users
                            </Link>
                          </li>
                          <li>
                            <Link
                              className="dropdown-item"
                              to="/admin/faqs"
                              onClick={() => setShowManagementMenu(false)}
                            >
                              FAQs
                            </Link>
                          </li>
                        </ul>
                      )}
                    </div>
                  </>
                )}

                <button
                  onClick={onLogout}
                  className="btn btn-outline-secondary btn-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>
                  Login
                </NavLink>
                <NavLink to="/register" className={linkClass}>
                  Register
                </NavLink>
              </>
            )}

            {isShopperView && !isAuthPage && <UserHamburgerMenu />}
            {user?.isAdmin && !isAuthPage && <AdminHamburgerMenu />}
          </nav>
        </div>
      </div>
    </header>
  );
}
